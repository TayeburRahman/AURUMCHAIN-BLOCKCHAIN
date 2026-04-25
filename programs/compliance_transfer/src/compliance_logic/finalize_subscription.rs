use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
};
use crate::state::*;
use crate::ComplianceError;

// ─── Accounts ─────────────────────────────────────────────────────────────────
#[derive(Accounts)]
pub struct FinalizeSubscription<'info> {
    // ── Subscription (the record to settle) ──────────────────────────────────
    #[account(
        mut,
        seeds = [b"subscription", subscription.investor.as_ref(), subscription.subscription_id.to_le_bytes().as_ref()],
        bump = subscription.bump,
        constraint = subscription.status == SubscriptionStatus::Pending @ ComplianceError::AlreadySettled,
    )]
    pub subscription: Account<'info, InvestmentSubscriptionAccount>,

    // ── Compliance control (authority check) ──────────────────────────────────
    #[account(
        seeds = [b"compliance_control"],
        bump = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    /// The compliance authority (super_admin or authority) who signs.
    #[account(
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,

    // ── Registry CPI accounts ─────────────────────────────────────────────────
    /// The project_registry program itself.
    /// CHECK: Validated by the issue_tokens CPI — we verify program ID inline.
    pub project_registry_program: UncheckedAccount<'info>,

    /// The registry ControlAccount PDA — seeds ["control"] on registry.
    /// CHECK: Validated by the issue_tokens CPI on the registry side.
    pub registry_control: UncheckedAccount<'info>,

    /// The registry ProjectAccount PDA — seeds ["project", project_id_bytes].
    /// CHECK: Validated by the issue_tokens CPI on the registry side.
    #[account(mut)]
    pub registry_project: UncheckedAccount<'info>,

    /// The SPL Token mint for this project.
    /// CHECK: Validated by the issue_tokens CPI on the registry side.
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,

    /// The investor's associated token account — tokens land here directly.
    /// CHECK: Validated by the issue_tokens CPI on the registry side.
    #[account(mut)]
    pub investor_token_account: UncheckedAccount<'info>,

    /// The registry's mint authority PDA — seeds ["mint_authority", project_id_bytes].
    /// CHECK: Validated by the issue_tokens CPI on the registry side.
    pub mint_authority_pda: UncheckedAccount<'info>,

    /// The SPL Token program.
    /// CHECK: Known address — validated below.
    pub token_program: UncheckedAccount<'info>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────
pub fn handle_finalize_subscription(
    ctx:                    Context<FinalizeSubscription>,
    settlement_tx_hash:     [u8; 64],
    allocated_token_amount: u64,
) -> Result<()> {

    let clock = Clock::get()?;
    let subscription = &mut ctx.accounts.subscription;

    // ── Read Registry Project for Price Validation ───────────────────────────
    // We manually deserialize the shadow project account to get the token price.
    let registry_project_info = ctx.accounts.registry_project.to_account_info();
    let registry_project_data = registry_project_info.try_borrow_data()?;
    // Skip 8-byte discriminator
    let project_registry_state = ProjectAccount::try_from_slice(&registry_project_data[8..])
        .map_err(|_| ComplianceError::InvalidStatus)?; // Generic error if deserialization fails

    // ── Calculate/Validate Token Amount ──────────────────────────────────────
    // If token_price_usdc is set (>0), we ignore the passed allocated_token_amount
    // and calculate it strictly based on the investment_amount.
    let final_token_amount = if project_registry_state.token_price_usdc > 0 {
        // investment_amount (USDC) * 10^6 / price_usdc
        // Assuming investment_amount is 6 decimals and we want 6 decimals output.
        subscription.investment_amount
            .checked_mul(1_000_000)
            .ok_or(ComplianceError::InvestmentTooHigh)?
            .checked_div(project_registry_state.token_price_usdc)
            .ok_or(ComplianceError::InvalidStatus)?
    } else {
        allocated_token_amount // Legacy fallback
    };

    // ── Validate the registry program ID ─────────────────────────────────────
    // control.registry_program was set at compliance initialization.
    require!(
        ctx.accounts.project_registry_program.key() == ctx.accounts.control.registry_program,
        ComplianceError::InvalidRegistryProgram
    );

    // ── Build the issue_tokens CPI ────────────────────────────────────────────
    //
    // The discriminator is computed at runtime from the canonical Anchor formula:
    //   sha256("global:<instruction_name>")[0..8]
    //
    // Defined here as a constant so there is ONE place to update if the
    // registry instruction is ever renamed. If this string drifts from the
    // actual function name in project_registry, the call simply fails with
    // an "unknown instruction" error — safe, loud, and immediately obvious.
    const REGISTRY_IX_ISSUE_TOKENS: &str = "global:issue_tokens";
    let hash = anchor_lang::solana_program::hash::hash(REGISTRY_IX_ISSUE_TOKENS.as_bytes());
    let discriminator: [u8; 8] = hash.to_bytes()[..8].try_into().unwrap();

    // Serialize the single `amount: u64` argument as little-endian bytes.
    let mut ix_data = Vec::with_capacity(16);
    ix_data.extend_from_slice(&discriminator);
    ix_data.extend_from_slice(&final_token_amount.to_le_bytes());

    let issue_tokens_ix = Instruction {
        program_id: ctx.accounts.project_registry_program.key(),
        accounts: vec![
            // Must match IssueTokens<'info> account order in issue_tokens.rs
            AccountMeta::new_readonly(ctx.accounts.registry_control.key(), false),
            AccountMeta::new(ctx.accounts.registry_project.key(), false),
            AccountMeta::new(ctx.accounts.mint.key(), false),
            AccountMeta::new(ctx.accounts.investor_token_account.key(), false),
            AccountMeta::new_readonly(ctx.accounts.mint_authority_pda.key(), false),
            AccountMeta::new_readonly(ctx.accounts.authority.key(), true),
            AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        ],
        data: ix_data,
    };

    invoke_signed(
        &issue_tokens_ix,
        &[
            ctx.accounts.registry_control.to_account_info(),
            ctx.accounts.registry_project.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.investor_token_account.to_account_info(),
            ctx.accounts.mint_authority_pda.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.project_registry_program.to_account_info(),
        ],
        &[], // No PDA signer from the compliance program's side —
             // the registry's mint_authority_pda signs internally within
             // the invoke_signed call inside issue_tokens itself.
    ).map_err(|_| ComplianceError::MintFailed)?;

    // ── Mark subscription as settled ─────────────────────────────────────────
    subscription.status                 = SubscriptionStatus::Allocated;
    subscription.settlement_tx_hash     = settlement_tx_hash;
    subscription.allocated_token_amount = final_token_amount;
    subscription.settled_at             = clock.unix_timestamp;

    emit!(InvestmentSettled {
        subscription_id:   subscription.subscription_id,
        investor:          subscription.investor,
        project_id:        subscription.project_id,
        tx_hash:           settlement_tx_hash,
        timestamp:         clock.unix_timestamp,
    });

    emit!(TokensAllocated {
        subscription_id:   subscription.subscription_id,
        investor:          subscription.investor,
        amount:            final_token_amount,
        timestamp:         clock.unix_timestamp,
    });

    Ok(())
}

// ─── Events ───────────────────────────────────────────────────────────────────
#[event]
pub struct InvestmentSettled {
    pub subscription_id:   u64,
    pub investor:          Pubkey,
    pub project_id:        u64,
    pub tx_hash:           [u8; 64],
    pub timestamp:         i64,
}

#[event]
pub struct TokensAllocated {
    pub subscription_id:   u64,
    pub investor:          Pubkey,
    pub amount:            u64,
    pub timestamp:         i64,
}

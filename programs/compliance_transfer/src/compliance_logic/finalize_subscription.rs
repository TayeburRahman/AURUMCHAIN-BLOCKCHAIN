use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
};
use crate::state::*;
use crate::ComplianceError;

#[derive(Accounts)]
pub struct FinalizeSubscription<'info> {
    #[account(
        mut,
        seeds = [b"subscription", subscription.investor.as_ref(), subscription.subscription_id.to_le_bytes().as_ref()],
        bump = subscription.bump,
        constraint = subscription.status == SubscriptionStatus::Pending @ ComplianceError::AlreadySettled,
    )]
    pub subscription: Account<'info, InvestmentSubscriptionAccount>,

    #[account(seeds = [b"compliance_control"], bump = control.bump)]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,

    pub project_registry_program: UncheckedAccount<'info>,
    pub registry_control: UncheckedAccount<'info>,
    #[account(mut)]
    pub registry_project: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    #[account(mut)]
    pub investor_token_account: UncheckedAccount<'info>,
    pub mint_authority_pda: UncheckedAccount<'info>,
    pub token_program: UncheckedAccount<'info>,
}

pub fn handle_finalize_subscription(
    ctx:                    Context<FinalizeSubscription>,
    settlement_tx_hash:     [u8; 64],
    allocated_token_amount: u64,
) -> Result<()> {

    let clock = Clock::get()?;
    let subscription = &mut ctx.accounts.subscription;

    // ── Read Registry Project & Calculate Token Amount ───────────────────────
    let final_token_amount: u64;
    {
        // THE FIX: Use a block to drop the immutable borrow before CPI!
        let registry_project_info = ctx.accounts.registry_project.to_account_info();
        let registry_project_data = registry_project_info.try_borrow_data()?;
        
        let mut data_ptr = &registry_project_data[8..];
        let project_state = ProjectAccount::deserialize(&mut data_ptr)
            .unwrap_or_else(|_| ProjectAccount::default());

        final_token_amount = if project_state.token_price_usdc > 0 {
            // Self-heal: If token_decimals is 0, assume it's a legacy project with 6 decimals
            let decimals = if project_state.token_decimals > 0 { project_state.token_decimals } else { 6 };
            let scaling_factor = 10_u64.pow(decimals as u32);

            subscription.investment_amount
                .checked_mul(scaling_factor)
                .ok_or(ComplianceError::InvestmentTooHigh)?
                .checked_div(project_state.token_price_usdc)
                .ok_or(ComplianceError::InvalidStatus)?
        } else {
            allocated_token_amount 
        };
    }

    // ── Build the issue_tokens CPI ────────────────────────────────────────────
    const REGISTRY_IX_ISSUE_TOKENS: &str = "global:issue_tokens";
    let hash = anchor_lang::solana_program::hash::hash(REGISTRY_IX_ISSUE_TOKENS.as_bytes());
    let discriminator: [u8; 8] = hash.to_bytes()[..8].try_into().unwrap();

    let mut ix_data = Vec::with_capacity(16);
    ix_data.extend_from_slice(&discriminator);
    ix_data.extend_from_slice(&final_token_amount.to_le_bytes());

    let issue_tokens_ix = Instruction {
        program_id: ctx.accounts.project_registry_program.key(),
        accounts: vec![
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
        &[],
    )?;

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

    Ok(())
}

#[event]
pub struct InvestmentSettled {
    pub subscription_id:   u64,
    pub investor:          Pubkey,
    pub project_id:        u64,
    pub tx_hash:           [u8; 64],
    pub timestamp:         i64,
}

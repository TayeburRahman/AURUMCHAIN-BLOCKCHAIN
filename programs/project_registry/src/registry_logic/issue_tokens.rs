use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use crate::state::*;
use crate::RegistryError;

// ─── Accounts ─────────────────────────────────────────────────────────────────
#[derive(Accounts)]
pub struct IssueTokens<'info> {
    #[account(
        seeds = [b"control"],
        bump,
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    /// The SPL Token mint for this project — must match project.mint.
    #[account(
        mut,
        constraint = mint.key() == project.mint @ RegistryError::InvalidMint
    )]
    pub mint: Account<'info, Mint>,

    /// The investor's associated token account — tokens land here directly.
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: Seeds are checked to verify this is the correct authority for the project.
    /// Supports both legacy (uninitialized) and verified (initialized) authority accounts.
    #[account(
        seeds = [b"mint_authority", project.project_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub mint_authority_pda: UncheckedAccount<'info>,

    /// Authorised caller: super_admin or operational_admin.
    /// In Phase 2, the compliance program will CPI into this instruction;
    /// the compliance admin's signature satisfies this constraint.
    #[account(
        constraint = (
            admin.key() == control.super_admin ||
            admin.key() == control.operational_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────
pub fn handle_issue_tokens(
    ctx:    Context<IssueTokens>,
    amount: u64,
) -> Result<()> {
    // ── Security Guards ───────────────────────────────────────────────────────
    require!(!ctx.accounts.control.is_emergency_paused, RegistryError::Unauthorized);
    require!(
        !ctx.accounts.project.mint_authority_revoked,
        RegistryError::MintAuthorityAlreadyRevoked
    );
    // Project must be in the Funding phase to mint tokens.
    require!(
        ctx.accounts.project.status == ProjectStatus::Funding,
        RegistryError::InvalidStatusTransition
    );
    // Emergency-brake check (is_paused is independent of status).
    require!(!ctx.accounts.project.is_paused, RegistryError::Unauthorized);

    let project = &mut ctx.accounts.project;

    // ── Supply Cap ────────────────────────────────────────────────────────────
    let new_total = project.tokens_issued
        .checked_add(amount)
        .ok_or(RegistryError::Overflow)?;
    require!(new_total <= project.supply_cap, RegistryError::SupplyCapExceeded);

    // ── Round Limit (0 = uncapped within supply_cap) ──────────────────────────
    if project.round_limit_tokens > 0 {
        let new_round = project.current_round_issued
            .checked_add(amount)
            .ok_or(RegistryError::Overflow)?;
        require!(new_round <= project.round_limit_tokens, RegistryError::RoundLimitExceeded);
        project.current_round_issued = new_round;
    }

    // Commit the lifetime counter before CPI (checks-effects-interactions).
    project.tokens_issued = new_total;

    // ── CPI: mint tokens to investor's wallet ─────────────────────────────────
    // We sign with the PDA seeds so the Token Program accepts the authority.
    let project_id_bytes = project.project_id.to_le_bytes();
    let bump = ctx.bumps.mint_authority_pda;
    let pda_seeds: &[&[u8]] = &[
        b"mint_authority",
        project_id_bytes.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[pda_seeds];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint:      ctx.accounts.mint.to_account_info(),
                to:        ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority_pda.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    emit!(TokensMinted {
        project_id:   project.project_id,
        recipient:    ctx.accounts.recipient_token_account.owner,
        amount,
        total_issued: project.tokens_issued,
        round_issued: project.current_round_issued,
    });

    Ok(())
}

// ─── Event ────────────────────────────────────────────────────────────────────
#[event]
pub struct TokensMinted {
    pub project_id:   u64,
    pub recipient:    Pubkey,
    pub amount:       u64,
    pub total_issued: u64,
    pub round_issued: u64,
}

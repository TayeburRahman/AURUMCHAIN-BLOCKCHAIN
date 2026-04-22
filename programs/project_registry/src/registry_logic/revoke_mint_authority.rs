use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, SetAuthority, Token};
use spl_token::instruction::AuthorityType;
use crate::state::*;
use crate::RegistryError;

// ─── Accounts ─────────────────────────────────────────────────────────────────
#[derive(Accounts)]
pub struct RevokeMintAuthority<'info> {
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

    /// The SPL Token mint — must match project.mint.
    #[account(
        mut,
        constraint = mint.key() == project.mint @ RegistryError::InvalidMint
    )]
    pub mint: Account<'info, Mint>,

    /// The PDA that currently holds mint authority.
    /// Seeds: ["mint_authority", project_id_bytes]
    #[account(
        seeds = [b"mint_authority", project.project_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub mint_authority_pda: SystemAccount<'info>,

    /// Only super_admin can permanently destroy the Master Key.
    #[account(
        constraint = super_admin.key() == control.super_admin @ RegistryError::Unauthorized
    )]
    pub super_admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────
pub fn handle_revoke_mint_authority(ctx: Context<RevokeMintAuthority>) -> Result<()> {
    require!(
        !ctx.accounts.project.mint_authority_revoked,
        RegistryError::MintAuthorityAlreadyRevoked
    );

    // ── CPI: set mint authority to None (permanent, irreversible) ─────────────
    // This is the "Master Key Destruction" — investors can verify on Solscan
    // that the Token Program itself now shows "Mint Authority: None".
    let project_id_bytes = ctx.accounts.project.project_id.to_le_bytes();
    let bump = ctx.bumps.mint_authority_pda;
    let pda_seeds: &[&[u8]] = &[
        b"mint_authority",
        project_id_bytes.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[pda_seeds];

    token::set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            SetAuthority {
                account_or_mint: ctx.accounts.mint.to_account_info(),
                current_authority: ctx.accounts.mint_authority_pda.to_account_info(),
            },
            signer_seeds,
        ),
        AuthorityType::MintTokens,
        None, // new_authority = None → permanently destroyed
    )?;

    // ── State Updates ─────────────────────────────────────────────────────────
    let project = &mut ctx.accounts.project;
    project.mint_authority_revoked = true;
    // Transition to Active: funding is closed, the project is now running.
    // (Guard: don't overwrite a Completed or Canceled terminal state.)
    if project.status == ProjectStatus::Funding {
        project.status = ProjectStatus::Active;
    }

    emit!(MintAuthorityRevoked {
        project_id: project.project_id,
        mint:       project.mint,
    });

    Ok(())
}

// ─── Event ────────────────────────────────────────────────────────────────────
#[event]
pub struct MintAuthorityRevoked {
    pub project_id: u64,
    pub mint:       Pubkey,
}


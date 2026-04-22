use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

// ─── Accounts ─────────────────────────────────────────────────────────────────
#[derive(Accounts)]
pub struct ResetRound<'info> {
    #[account(
        seeds = [b"control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump  = project.bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    /// Only super_admin or operational_admin can start a new round.
    #[account(
        constraint = (
            admin.key() == control.super_admin ||
            admin.key() == control.operational_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────
/// Starts a new issuance round.
///
/// Resets `current_round_issued` to zero and optionally updates
/// `round_limit_tokens` for the new round.
///
/// Typical use-cases:
///   - Mining project completes round 1 (10% issued), admin resets
///     and sets a new 10% limit for round 2.
///   - Real-estate project sets round_limit = 0 (uncapped) on creation,
///     so this instruction is never needed.
pub fn handle_reset_round(
    ctx:           Context<ResetRound>,
    new_round_limit: Option<u64>,
) -> Result<()> {
    // SECURITY: Global Pause Check
    require!(!ctx.accounts.control.is_emergency_paused, RegistryError::Unauthorized);
    // Cannot reset after mint authority is permanently revoked.
    require!(
        !ctx.accounts.project.mint_authority_revoked,
        RegistryError::MintAuthorityAlreadyRevoked
    );

    let project = &mut ctx.accounts.project;

    let old_round_issued  = project.current_round_issued;
    let old_round_limit   = project.round_limit_tokens;

    // Reset the round counter.
    project.current_round_issued = 0;

    // Optionally update the cap for the new round.
    if let Some(new_limit) = new_round_limit {
        // Guard: round limit cannot exceed the lifetime supply cap.
        require!(new_limit <= project.supply_cap, RegistryError::SupplyCapExceeded);
        project.round_limit_tokens = new_limit;
    }

    emit!(RoundReset {
        project_id:       project.project_id,
        old_round_issued,
        old_round_limit,
        new_round_limit:  project.round_limit_tokens,
    });

    Ok(())
}

// ─── Event ────────────────────────────────────────────────────────────────────
#[event]
pub struct RoundReset {
    pub project_id:      u64,
    pub old_round_issued: u64,
    pub old_round_limit:  u64,
    pub new_round_limit:  u64,
}

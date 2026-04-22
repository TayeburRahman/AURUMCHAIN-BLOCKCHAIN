use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProjectUpdateParams {
    pub min_investment_usdc:    Option<u64>,
    pub max_investment_usdc:    Option<u64>,
    pub subscription_start:     Option<i64>,
    pub subscription_end:       Option<i64>,
    pub distribution_cadence:   Option<u8>,
    pub lockup_end_ts:          Option<i64>,
    // ── Phase fields ─────────────────────────────────────────────────────────
    // New round limit for the current or next phase.
    // Guard: must not exceed supply_cap.
    pub round_limit_tokens:     Option<u64>,
    // Asset type can be corrected by super_admin only.
    pub asset_type:             Option<AssetType>,
}

#[derive(Accounts)]
pub struct UpdateProjectParams<'info> {
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

    #[account(
        constraint = (
            admin.key() == control.super_admin ||
            admin.key() == control.operational_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn handle_update_project_params(
    ctx:    Context<UpdateProjectParams>,
    params: ProjectUpdateParams,
) -> Result<()> {
    let project = &mut ctx.accounts.project;

    if let (Some(start), Some(end)) = (params.subscription_start, params.subscription_end) {
        require!(end > start, RegistryError::InvalidSubscriptionWindow);
        project.subscription_start = start;
        project.subscription_end   = end;
    }

    if let Some(min) = params.min_investment_usdc {
        project.min_investment_usdc = min;
    }
    if let Some(max) = params.max_investment_usdc {
        project.max_investment_usdc = max;
    }
    if let Some(cadence) = params.distribution_cadence {
        project.distribution_cadence = cadence;
    }
    if let Some(lockup) = params.lockup_end_ts {
        project.lockup_end_ts = lockup;
    }
    // Phase field updates
    if let Some(round_limit) = params.round_limit_tokens {
        // Guard: round limit cannot exceed the lifetime supply cap
        require!(round_limit <= project.supply_cap, RegistryError::SupplyCapExceeded);
        project.round_limit_tokens = round_limit;
    }
    if let Some(asset_type) = params.asset_type {
        project.asset_type = asset_type;
    }

    emit!(ProjectUpdated { project_id: project.project_id });

    Ok(())
}

#[event]
pub struct ProjectUpdated {
    pub project_id: u64,
}

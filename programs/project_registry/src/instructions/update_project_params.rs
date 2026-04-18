use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProjectUpdateParams {
    pub min_investment_usdc:    Option<u64>,
    pub max_investment_usdc:    Option<u64>,
    pub subscription_start:     Option<i64>,
    pub subscription_end:       Option<i64>,
    pub distribution_cadence:   Option<u8>, // Changed from u32
    pub lockup_end_ts:          Option<i64>,
}

#[derive(Accounts)]
pub struct UpdateProjectParams<'info> {
    #[account(
        seeds = [b"registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump  = project.bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        constraint = (
            admin.key() == registry.authority ||
            admin.key() == registry.super_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn handler(
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

    emit!(ProjectUpdated { project_id: project.project_id });

    Ok(())
}

#[event]
pub struct ProjectUpdated {
    pub project_id: u64,
}

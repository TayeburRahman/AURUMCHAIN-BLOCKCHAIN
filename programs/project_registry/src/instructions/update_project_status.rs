use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError; // I'll keep RegistryError in lib.rs for now or move it later

#[derive(Accounts)]
pub struct UpdateProjectStatus<'info> {
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
    ctx: Context<UpdateProjectStatus>,
    _project_id: u64, // project_id is in seeds, but provided as param for consistency
    is_active: bool,
    is_paused: bool,
) -> Result<()> {
    let project = &mut ctx.accounts.project;

    let old_is_active = project.is_active;
    let old_is_paused = project.is_paused;

    project.is_active = is_active;
    project.is_paused = is_paused;

    emit!(PauseStateChanged {
        project_id:    project.project_id,
        old_is_active,
        new_is_active: is_active,
        old_is_paused,
        new_is_paused: is_paused,
    });

    Ok(())
}

#[event]
pub struct PauseStateChanged {
    pub project_id:    u64,
    pub old_is_active: bool,
    pub new_is_active: bool,
    pub old_is_paused: bool,
    pub new_is_paused: bool,
}

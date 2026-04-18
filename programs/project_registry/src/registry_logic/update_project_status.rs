use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError; // I'll keep RegistryError in lib.rs for now or move it later

#[derive(Accounts)]
pub struct UpdateProjectStatus<'info> {
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

    #[account(
        constraint = (
            admin.key() == control.super_admin ||
            admin.key() == control.operational_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn handle_update_project_status(
    ctx: Context<UpdateProjectStatus>,
    _project_id: u64, // project_id is in seeds, but provided as param for consistency
    is_active: bool,
    is_paused: bool,
) -> Result<()> {
    // SECURITY: Global Pause Check
    require!(!ctx.accounts.control.is_emergency_paused, RegistryError::Unauthorized);

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

use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

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
    ctx:        Context<UpdateProjectStatus>,
    _project_id: u64,       // present for caller convenience; PDA seed is the real guard
    new_status:  ProjectStatus,
    is_paused:   bool,
) -> Result<()> {
    // SECURITY: Global Pause Check
    require!(!ctx.accounts.control.is_emergency_paused, RegistryError::Unauthorized);

    let project = &mut ctx.accounts.project;

    // Guard: terminal states are irreversible — once Completed or Canceled
    // the project cannot be moved back to any active state.
    let is_terminal = project.status == ProjectStatus::Completed
        || project.status == ProjectStatus::Canceled;
    require!(!is_terminal, RegistryError::InvalidStatusTransition);

    // Guard: cannot open for funding without a mint address being set first.
    if new_status == ProjectStatus::Funding {
        require!(
            project.mint != Pubkey::default(),
            RegistryError::MintNotSet
        );
    }

    let old_status = project.status.clone();
    let old_is_paused = project.is_paused;

    project.status    = new_status;
    project.is_paused = is_paused;

    emit!(ProjectStateChanged {
        project_id:    project.project_id,
        old_status,
        new_status:    project.status.clone(),
        old_is_paused,
        new_is_paused: is_paused,
    });

    Ok(())
}

#[event]
pub struct ProjectStateChanged {
    pub project_id:    u64,
    pub old_status:    ProjectStatus,
    pub new_status:    ProjectStatus,
    pub old_is_paused: bool,
    pub new_is_paused: bool,
}


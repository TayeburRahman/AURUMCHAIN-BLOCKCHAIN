use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct SetEmergencyPause<'info> {
    #[account(
        mut,
        seeds = [b"control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(
        constraint = super_admin.key() == control.super_admin @ RegistryError::Unauthorized
    )]
    pub super_admin: Signer<'info>,
}

pub fn handle_set_emergency_pause(
    ctx: Context<SetEmergencyPause>,
    is_paused: bool,
) -> Result<()> {
    let control = &mut ctx.accounts.control;
    control.is_emergency_paused = is_paused;

    emit!(EmergencyPauseToggled {
        is_paused,
        authority: ctx.accounts.super_admin.key(),
    });

    Ok(())
}

#[event]
pub struct EmergencyPauseToggled {
    pub is_paused: bool,
    pub authority: Pubkey,
}

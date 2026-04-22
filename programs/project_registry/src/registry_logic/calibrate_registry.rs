use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct CalibrateRegistry<'info> {
    #[account(
        mut,
        seeds = [b"control"],
        bump,
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(
        constraint = admin.key() == control.super_admin @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn handle_calibrate_registry(
    ctx: Context<CalibrateRegistry>,
    new_count: u64,
) -> Result<()> {
    let control = &mut ctx.accounts.control;
    
    msg!("CALIBRATION: Updating project_count from {} to {}", control.project_count, new_count);
    
    control.project_count = new_count;
    
    Ok(())
}

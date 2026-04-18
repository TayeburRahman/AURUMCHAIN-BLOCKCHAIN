use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeControl<'info> {
    #[account(
        init,
        payer  = payer,
        space  = ControlAccount::SIZE,
        seeds  = [b"control"],
        bump
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_control(
    ctx: Context<InitializeControl>,
    operational_admin: Pubkey,
    operational_limits: u64,
) -> Result<()> {
    let control = &mut ctx.accounts.control;
    
    // Super Admin is locked to the deployer (payer)
    control.super_admin         = ctx.accounts.payer.key();
    control.operational_admin   = operational_admin;
    control.upgrade_authority   = ctx.accounts.payer.key(); // Default to super admin
    control.is_emergency_paused = false;
    control.operational_limits  = operational_limits;
    control.project_count       = 0;
    control.bump                = ctx.bumps.control;

    emit!(ControlInitialized {
        super_admin:       control.super_admin,
        operational_admin: control.operational_admin,
    });

    Ok(())
}

#[event]
pub struct ControlInitialized {
    pub super_admin:       Pubkey,
    pub operational_admin: Pubkey,
}

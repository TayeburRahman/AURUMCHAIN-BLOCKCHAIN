use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;

#[derive(Accounts)]
pub struct InitializeCompliance<'info> {
    #[account(
        init,
        payer  = payer,
        space  = ComplianceControl::SIZE,
        seeds  = [b"compliance_control"],
        bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_compliance(
    ctx:              Context<InitializeCompliance>,
    authority:        Pubkey,
    super_admin:      Pubkey,
    registry_program: Pubkey,
) -> Result<()> {
    let control = &mut ctx.accounts.control;
    control.authority        = authority;
    control.super_admin      = super_admin;
    control.kyc_bypass       = false; 
    control.transfers_paused = false;
    control.registry_program = registry_program;
    control.bump             = ctx.bumps.control;
    Ok(())
}

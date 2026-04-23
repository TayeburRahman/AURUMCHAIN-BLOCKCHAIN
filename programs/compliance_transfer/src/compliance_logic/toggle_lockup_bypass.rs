use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;

#[derive(Accounts)]
pub struct ToggleLockupBypass<'info> {
    #[account(
        seeds = [b"compliance_control"],
        bump = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        mut,
        seeds = [b"eligibility", investor_wallet.key().as_ref()],
        bump = eligibility.bump,
    )]
    pub eligibility: Account<'info, InvestorEligibilityAccount>,

    pub investor_wallet: SystemAccount<'info>,

    #[account(
        constraint = (
            admin.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn handle_toggle_lockup_bypass(
    ctx: Context<ToggleLockupBypass>,
    enabled: bool,
) -> Result<()> {
    let eligibility = &mut ctx.accounts.eligibility;
    eligibility.lockup_bypass = enabled;
    Ok(())
}

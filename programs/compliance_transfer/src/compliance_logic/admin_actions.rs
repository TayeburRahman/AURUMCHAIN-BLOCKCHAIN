use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;

#[derive(Accounts)]
pub struct SuperAdminAction<'info> {
    #[account(
        mut,
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        constraint = super_admin.key() == control.super_admin
            @ ComplianceError::Unauthorized
    )]
    pub super_admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

pub fn handle_set_kyc_bypass(
    ctx:     Context<SuperAdminAction>,
    enabled: bool,
    _nonce:  u64,
) -> Result<()> {
    let clock = Clock::get()?;
    ctx.accounts.control.kyc_bypass = enabled;

    emit!(KycBypassChanged {
        bypass_enabled: enabled,
        changed_by:     ctx.accounts.super_admin.key(),
        timestamp:      clock.unix_timestamp,
    });

    Ok(())
}

pub fn handle_set_global_transfer_pause(
    ctx:    Context<AdminAction>,
    paused: bool,
    _nonce: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    ctx.accounts.control.transfers_paused = paused;

    emit!(GlobalPauseChanged {
        transfers_paused: paused,
        changed_by:       ctx.accounts.authority.key(),
        timestamp:        clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct GlobalPauseChanged {
    pub transfers_paused: bool,
    pub changed_by:       Pubkey,
    pub timestamp:        i64,
}

#[event]
pub struct KycBypassChanged {
    pub bypass_enabled: bool,
    pub changed_by:     Pubkey,
    pub timestamp:      i64,
}

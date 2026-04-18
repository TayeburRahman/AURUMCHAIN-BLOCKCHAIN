use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;
use crate::compliance_logic::RecordWalletParams;

#[derive(Accounts)]
pub struct RefreshVerifiedWallet<'info> {
    #[account(
        mut,
        seeds = [b"eligibility", eligibility.wallet.as_ref()],
        bump  = eligibility.bump,
    )]
    pub eligibility: Account<'info, InvestorEligibilityAccount>,

    #[account(
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

pub fn handle_refresh_eligibility(
    ctx:    Context<RefreshVerifiedWallet>,
    params: RecordWalletParams,
) -> Result<()> {
    let clock = Clock::get()?;

    if params.expiry_timestamp > 0 {
        require!(params.expiry_timestamp > clock.unix_timestamp, ComplianceError::InvalidExpiry);
    }

    let eligibility = &mut ctx.accounts.eligibility;
    eligibility.kyc_status               = params.kyc_status.clone();
    eligibility.aml_status               = params.aml_status.clone();
    eligibility.identity_hash            = params.identity_hash;
    eligibility.investment_allowed        = params.investment_allowed;
    eligibility.transfer_allowed          = params.transfer_allowed;
    eligibility.expiry_timestamp          = params.expiry_timestamp;
    eligibility.reverification_required   = false;
    eligibility.recorded_by              = ctx.accounts.authority.key();

    let kyc_byte: u8 = match &params.kyc_status {
        KycStatus::Pending  => 0,
        KycStatus::Approved => 1,
        KycStatus::Rejected => 2,
        KycStatus::Expired  => 3,
    };
    let aml_byte: u8 = match &params.aml_status {
        AmlStatus::Clear   => 0,
        AmlStatus::Flagged => 1,
        AmlStatus::Blocked => 2,
    };

    emit!(crate::compliance_logic::record_verified_wallet::WalletVerified {
        wallet:             eligibility.wallet,
        kyc_status:         kyc_byte,
        aml_status:         aml_byte,
        investment_allowed: params.investment_allowed,
        transfer_allowed:   params.transfer_allowed,
        expiry_timestamp:   params.expiry_timestamp,
        timestamp:          clock.unix_timestamp,
    });

    Ok(())
}

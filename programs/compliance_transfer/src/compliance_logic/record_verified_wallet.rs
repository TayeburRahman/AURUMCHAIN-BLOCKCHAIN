use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;
use crate::compliance_logic::RecordWalletParams;

#[derive(Accounts)]
pub struct RecordVerifiedWallet<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = InvestorEligibilityAccount::SIZE,
        seeds = [b"eligibility", wallet.key().as_ref()],
        bump,
    )]
    pub eligibility: Account<'info, InvestorEligibilityAccount>,

    /// CHECK: Target wallet address being registered
    pub wallet: UncheckedAccount<'info>,

    #[account(
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        mut,
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_record_verified_wallet(
    ctx:    Context<RecordVerifiedWallet>,
    params: RecordWalletParams,
) -> Result<()> {
    let clock = Clock::get()?;

    if params.expiry_timestamp > 0 {
        require!(params.expiry_timestamp > clock.unix_timestamp, ComplianceError::InvalidExpiry);
    }
    require!(params.identity_hash != [0u8; 32], ComplianceError::EmptyIdentityHash);

    let eligibility = &mut ctx.accounts.eligibility;
    eligibility.wallet                   = ctx.accounts.wallet.key();
    eligibility.kyc_status               = params.kyc_status.clone();
    eligibility.aml_status               = params.aml_status.clone();
    eligibility.identity_hash            = params.identity_hash;
    eligibility.investment_allowed        = params.investment_allowed;
    eligibility.transfer_allowed          = params.transfer_allowed;
    eligibility.expiry_timestamp          = params.expiry_timestamp;
    eligibility.approval_timestamp        = clock.unix_timestamp;
    eligibility.reverification_required   = false;
    eligibility.recorded_by              = ctx.accounts.authority.key();
    eligibility.bump                     = ctx.bumps.eligibility;

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

    emit!(WalletVerified {
        wallet:             ctx.accounts.wallet.key(),
        kyc_status:         kyc_byte,
        aml_status:         aml_byte,
        investment_allowed: params.investment_allowed,
        transfer_allowed:   params.transfer_allowed,
        expiry_timestamp:   params.expiry_timestamp,
        timestamp:          clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct WalletVerified {
    pub wallet:             Pubkey,
    pub kyc_status:         u8,
    pub aml_status:         u8,
    pub investment_allowed: bool,
    pub transfer_allowed:   bool,
    pub expiry_timestamp:   i64,
    pub timestamp:          i64,
}

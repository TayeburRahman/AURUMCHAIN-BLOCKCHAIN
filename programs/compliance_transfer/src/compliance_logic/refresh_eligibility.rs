use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;
use crate::compliance_logic::RecordWalletParams;

#[derive(Accounts)]
pub struct RefreshVerifiedWallet<'info> {
    /// CHECK: Manual discriminator check
    #[account(
        mut,
        seeds = [b"eligibility", wallet.key().as_ref()],
        bump,
    )]
    pub eligibility: UncheckedAccount<'info>,

    /// CHECK: Wallet for seed derivation
    pub wallet: UncheckedAccount<'info>,

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

    // ── Eligibility Validation ──────────────────────────────────────────────
    let mut data = ctx.accounts.eligibility.try_borrow_mut_data()?;
    let mut eligibility = InvestorEligibilityAccount::load_checked(&ctx.accounts.eligibility)?;
    // ────────────────────────────────────────────────────────────────────────

    if params.expiry_timestamp > 0 {
        require!(params.expiry_timestamp > clock.unix_timestamp, ComplianceError::InvalidExpiry);
    }

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

    // 5. Serialize back
    eligibility.serialize(&mut &mut data[8..])?;
    // Note: We keep the discriminator that was already there (legacy or standard)

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

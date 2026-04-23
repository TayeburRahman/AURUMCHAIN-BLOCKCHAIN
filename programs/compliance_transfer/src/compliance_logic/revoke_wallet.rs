use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;

#[derive(Accounts)]
pub struct RevokeWallet<'info> {
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

pub fn handle_revoke_wallet(ctx: Context<RevokeWallet>) -> Result<()> {
    let clock = Clock::get()?;
    
    // ── Eligibility Validation ──────────────────────────────────────────────
    let mut data = ctx.accounts.eligibility.try_borrow_mut_data()?;
    let mut eligibility = InvestorEligibilityAccount::load_checked(&ctx.accounts.eligibility)?;
    // ────────────────────────────────────────────────────────────────────────
    
    eligibility.kyc_status         = KycStatus::Rejected;
    eligibility.aml_status         = AmlStatus::Blocked;
    eligibility.investment_allowed = false;
    eligibility.transfer_allowed   = false;

    // Serialize back
    eligibility.serialize(&mut &mut data[8..])?;

    emit!(WalletRevoked {
        wallet:     eligibility.wallet,
        revoked_by: ctx.accounts.authority.key(),
        timestamp:  clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct WalletRevoked {
    pub wallet:     Pubkey,
    pub revoked_by: Pubkey,
    pub timestamp:  i64,
}

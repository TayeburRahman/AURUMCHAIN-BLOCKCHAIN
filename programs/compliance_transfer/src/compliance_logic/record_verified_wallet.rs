use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;
use crate::compliance_logic::RecordWalletParams;

#[derive(Accounts)]
pub struct RecordVerifiedWallet<'info> {
    /// CHECK: Manual initialization or overwrite to handle schema upgrades.
    #[account(
        mut,
        seeds = [b"eligibility", wallet.key().as_ref()],
        bump,
    )]
    pub eligibility: UncheckedAccount<'info>,

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

    // ── Manual Account Management ──────────────────────────────────────────
    let eligibility_info = &ctx.accounts.eligibility;
    let authority_info = &ctx.accounts.authority;
    let system_program = &ctx.accounts.system_program;

    // 1. If account is empty, initialize it.
    if eligibility_info.data_is_empty() {
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"eligibility",
            ctx.accounts.wallet.key.as_ref(),
            &[ctx.bumps.eligibility],
        ]];

        anchor_lang::system_program::create_account(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                anchor_lang::system_program::CreateAccount {
                    from: authority_info.to_account_info(),
                    to: eligibility_info.to_account_info(),
                },
                signer_seeds,
            ),
            Rent::get()?.minimum_balance(InvestorEligibilityAccount::SIZE),
            InvestorEligibilityAccount::SIZE as u64,
            ctx.program_id,
        )?;
    } else {
        // 2. If account exists but size is different (Upgrade), realloc it.
        let current_len = eligibility_info.data_len();
        if current_len < InvestorEligibilityAccount::SIZE {
            let rent = Rent::get()?;
            let new_rent_minimum = rent.minimum_balance(InvestorEligibilityAccount::SIZE);
            let lamports_diff = new_rent_minimum.saturating_sub(eligibility_info.lamports());
            
            if lamports_diff > 0 {
                anchor_lang::system_program::transfer(
                    CpiContext::new(
                        system_program.to_account_info(),
                        anchor_lang::system_program::Transfer {
                            from: authority_info.to_account_info(),
                            to: eligibility_info.to_account_info(),
                        },
                    ),
                    lamports_diff,
                )?;
            }
            
            eligibility_info.realloc(InvestorEligibilityAccount::SIZE, false)?;
        }
    }

    // 3. Now we can safely deserialize and write.
    let mut data = eligibility_info.try_borrow_mut_data()?;
    let mut eligibility = InvestorEligibilityAccount::try_from_slice(&data[8..]).unwrap_or_else(|_| {
        // If try_from_slice fails (due to old schema), we start with a clean default
        InvestorEligibilityAccount::default()
    });

    // 4. Update fields
    eligibility.wallet                   = ctx.accounts.wallet.key();
    eligibility.kyc_status               = params.kyc_status.clone();
    eligibility.aml_status               = params.aml_status.clone();
    eligibility.identity_hash            = params.identity_hash;
    eligibility.investment_allowed        = params.investment_allowed;
    eligibility.transfer_allowed          = params.transfer_allowed;
    eligibility.approval_timestamp        = clock.unix_timestamp;
    eligibility.expiry_timestamp          = params.expiry_timestamp;
    eligibility.reverification_required   = false;
    eligibility.lockup_bypass            = false;
    eligibility.recorded_by              = ctx.accounts.authority.key();
    eligibility.bump                     = ctx.bumps.eligibility;

    // 5. Serialize back
    let writer = &mut data[..];
    // Write discriminator manually (InvestorEligibilityAccount)
    let disc = [213, 219, 137, 241, 143, 227, 230, 203]; // InvestorEligibilityAccount discriminator
    writer[..8].copy_from_slice(&disc);
    eligibility.serialize(&mut &mut data[8..])?;

    // ── Events ─────────────────────────────────────────────────────────────
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

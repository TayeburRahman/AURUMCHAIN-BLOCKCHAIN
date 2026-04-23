use anchor_lang::prelude::*;
use crate::state::{KycStatus, AmlStatus};

/// Per-wallet eligibility – PDA seeds: [b"eligibility", wallet_pubkey]
/// Created by record_verified_wallet; read by transfer_validate.
#[account]
#[derive(Default)]
pub struct InvestorEligibilityAccount {
    /// The Solana wallet this record belongs to
    pub wallet:                  Pubkey,     // 32
    /// KYC approval state
    pub kyc_status:              KycStatus,  //  1
    /// AML / sanctions state
    pub aml_status:              AmlStatus,  //  1
    /// SHA-256 of off-chain applicant_id (Sumsub) – audit reference
    pub identity_hash:           [u8; 32],   // 32
    /// Whether this wallet may subscribe to investments
    pub investment_allowed:      bool,       //  1
    /// Whether this wallet may send or receive project tokens
    pub transfer_allowed:        bool,       //  1
    /// Unix timestamp of initial approval
    pub approval_timestamp:      i64,        //  8
    /// Unix timestamp when eligibility expires (0 = never)
    pub expiry_timestamp:        i64,        //  8
    /// Flag indicating re-verification is in progress or required
    pub reverification_required: bool,
    pub lockup_bypass:           bool,
    /// Which admin key recorded this entry
    pub recorded_by:             Pubkey,     // 32
    pub bump:                    u8,         //  1
}

impl InvestorEligibilityAccount {
    // 8 (disc) + 32 + 1 + 1 + 32 + 1 + 1 + 8 + 8 + 1 + 1 + 32 + 1 + 31 (padding) = 158
    pub const SIZE: usize = 8 + 32 + 1 + 1 + 32 + 1 + 1 + 8 + 8 + 1 + 1 + 32 + 1 + 31;

    // --- Discriminator Management ---
    // Standard Anchor: sha256("account:InvestorEligibilityAccount")[..8]
    pub const DISCRIMINATOR_STANDARD: [u8; 8] = [38, 90, 191, 114, 179, 67, 120, 93];
    // Legacy/Hardcoded: Found on-chain (likely global:InvestorEligibilityAccount)
    pub const DISCRIMINATOR_LEGACY: [u8; 8] = [213, 219, 137, 241, 143, 227, 230, 203];

    /// Centralized helper to deserialize while accepting both legacy and standard signatures.
    pub fn load_checked(info: &AccountInfo) -> Result<Self> {
        let data = info.try_borrow_data()?;
        if info.data_is_empty() {
            return Err(ErrorCode::AccountNotInitialized.into());
        }

        let disc = &data[0..8];
        if disc != &Self::DISCRIMINATOR_STANDARD && disc != &Self::DISCRIMINATOR_LEGACY {
            return Err(ErrorCode::AccountDiscriminatorMismatch.into());
        }

        let mut reader = &data[8..];
        Ok(Self::deserialize(&mut reader)?)
    }
}

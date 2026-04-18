mod initialize_compliance;
mod record_verified_wallet;
mod refresh_eligibility;
mod revoke_wallet;
mod admin_actions;
mod transfer_validate;
mod subscribe_investment;
mod finalize_subscription;

// Standard Program 1 Pattern: 
// Private module declarations + Glob re-exports
pub use initialize_compliance::*;
pub use record_verified_wallet::*;
pub use refresh_eligibility::*;
pub use revoke_wallet::*;
pub use admin_actions::*;
pub use transfer_validate::*;
pub use subscribe_investment::*;
pub use finalize_subscription::*;

use anchor_lang::prelude::*;
use crate::state::{KycStatus, AmlStatus};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RecordWalletParams {
    pub kyc_status:         KycStatus,
    pub aml_status:         AmlStatus,
    /// SHA-256 of off-chain identity record (Sumsub applicant_id)
    pub identity_hash:      [u8; 32],
    pub investment_allowed: bool,
    pub transfer_allowed:   bool,
    /// Unix timestamp when eligibility expires (0 = never expires)
    pub expiry_timestamp:   i64,
}

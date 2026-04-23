pub mod control_account;
pub mod eligibility_account;
pub mod subscription_account;
pub mod external_state;

// Re-expose accounts so they can be accessed via `use crate::state::*;`
pub use control_account::*;
pub use eligibility_account::*;
pub use subscription_account::*;
pub use external_state::*;

use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Default)]
pub enum KycStatus {
    #[default]
    Pending,
    Approved,
    Rejected,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Default)]
pub enum AmlStatus {
    #[default]
    Clear,
    Flagged,
    Blocked,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Default)]
pub enum SubscriptionStatus {
    #[default]
    Pending,
    Settled,
    Allocated,
    Refunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Default)]
pub struct TransferDecision {
    pub allowed:     bool,
    pub reason_code: u8,
}

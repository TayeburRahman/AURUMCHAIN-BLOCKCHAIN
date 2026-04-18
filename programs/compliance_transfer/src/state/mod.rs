pub mod control_account;
pub mod eligibility_account;
pub mod subscription_account;

// Re-expose accounts so they can be accessed via `use crate::state::*;`
pub use control_account::*;
pub use eligibility_account::*;
pub use subscription_account::*;

use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum KycStatus {
    Pending,
    Approved,
    Rejected,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum AmlStatus {
    Clear,
    Flagged,
    Blocked,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum SubscriptionStatus {
    Pending,
    Settled,
    Allocated,
    Refunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub struct TransferDecision {
    pub allowed:     bool,
    pub reason_code: u8,
}

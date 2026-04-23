use anchor_lang::prelude::*;

#[account]
pub struct DistributionEpoch {
    pub project_id:             u64,
    pub epoch_id:               u64,
    pub profit_per_token:       u64, // The manual rate set by admin
    pub record_date:            i64,
    pub total_payouts_executed: u64,
    pub is_completed:           bool,
    pub bump:                   u8,
}

impl DistributionEpoch {
    pub const SIZE: usize = 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct EpochCounter {
    pub project_id: u64,
    pub count:      u64,
    pub bump:       u8,
}

impl EpochCounter {
    pub const SIZE: usize = 8 + 8 + 8 + 1;
}

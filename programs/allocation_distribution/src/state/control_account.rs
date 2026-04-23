use anchor_lang::prelude::*;

#[account]
pub struct DistributionControl {
    pub admin:     Pubkey,
    pub is_paused: bool,
    pub bump:      u8,
}

impl DistributionControl {
    pub const SIZE: usize = 8 + 32 + 1 + 1;
}

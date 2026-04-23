use anchor_lang::prelude::*;

#[account]
pub struct PayoutRecord {
    pub epoch:       Pubkey,
    pub investor:    Pubkey,
    pub amount_paid: u64,
    pub timestamp:   i64,
    pub bump:        u8,
}

impl PayoutRecord {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

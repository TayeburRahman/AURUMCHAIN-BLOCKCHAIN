use anchor_lang::prelude::*;

#[account]
pub struct DistributionControl {
    pub admin:     Pubkey,
    pub is_paused: bool,
    pub bump:      u8,
    /// ── FUTURE EXPANSION PADDING ─────────────────────────────────────────────
    pub padding:   [u8; 64], 
}

impl DistributionControl {
    pub const SIZE: usize = 8 + 32 + 1 + 1 + 64;
}

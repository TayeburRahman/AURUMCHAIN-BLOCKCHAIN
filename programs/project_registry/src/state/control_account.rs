use anchor_lang::prelude::*;

#[account]
pub struct ControlAccount {
    pub super_admin:         Pubkey,
    pub operational_admin:   Pubkey,
    pub upgrade_authority:   Pubkey,
    pub is_emergency_paused: bool,
    pub operational_limits:  u64,
    pub project_count:       u64,
    pub bump:                u8,
    /// ── FUTURE EXPANSION PADDING ─────────────────────────────────────────────
    pub padding:             [u8; 64], 
}

impl ControlAccount {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 1 + 8 + 8 + 1 + 64;
}

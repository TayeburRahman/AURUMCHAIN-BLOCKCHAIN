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
}

impl ControlAccount {
    // 8 + 32 + 32 + 32 + 1 + 8 + 8 + 1
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 1 + 8 + 8 + 1;
}

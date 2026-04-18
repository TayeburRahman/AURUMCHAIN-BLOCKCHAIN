use anchor_lang::prelude::*;

#[account]
pub struct RegistryConfig {
    pub authority:     Pubkey,
    pub super_admin:   Pubkey,
    pub project_count: u64,
    pub bump:          u8,
}

impl RegistryConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 1 + 64;
}

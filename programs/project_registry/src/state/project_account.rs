use anchor_lang::prelude::*;

#[account]
pub struct ProjectAccount {
    pub project_id:             u64,             // 8
    pub registry:               Pubkey,          // 32
    pub creator:                Pubkey,          // 32
    pub name:                   String,          // 4 + 64
    pub symbol:                 String,          // 4 + 10
    pub uri:                    String,          // 4 + 200
    pub supply_cap:             u64,             // 8
    pub tokens_issued:          u64,             // 8
    pub min_investment_usdc:    u64,             // 8
    pub max_investment_usdc:    u64,             // 8
    pub accepted_stablecoin:    Pubkey,          // 32
    pub treasury_wallet:        Pubkey,          // 32
    pub mint:                   Pubkey,          // 32
    pub lockup_end_ts:          i64,             // 8
    pub subscription_start:     i64,             // 8
    pub subscription_end:       i64,             // 8
    pub created_at:             i64,             // 8 (NEW)
    pub distribution_cadence:   u8,              // 1 (Changed from u32 to u8)
    pub is_active:              bool,            // 1
    pub is_paused:              bool,            // 1 (Consolidated flag)
    pub mint_authority_revoked: bool,            // 1
    pub bump:                   u8,              // 1
}

impl ProjectAccount {
    pub const MAX_NAME_LEN:   usize = 64;
    pub const MAX_SYMBOL_LEN: usize = 10;
    pub const MAX_URI_LEN:    usize = 200;

    pub const SIZE: usize =
        8             // discriminator
        + 8           // project_id
        + 32          // registry
        + 32          // creator
        + (4 + 64)    // name
        + (4 + 10)    // symbol
        + (4 + 200)   // uri
        + 8           // supply_cap
        + 8           // tokens_issued
        + 8           // min_investment_usdc
        + 8           // max_investment_usdc
        + 32          // accepted_stablecoin
        + 32          // treasury_wallet
        + 32          // mint
        + 8           // lockup_end_ts
        + 8           // subscription_start
        + 8           // subscription_end
        + 8           // created_at
        + 1           // distribution_cadence
        + 1           // is_active
        + 1           // is_paused
        + 1           // mint_authority_revoked
        + 1           // bump
        + 64;         // padding for future use
}

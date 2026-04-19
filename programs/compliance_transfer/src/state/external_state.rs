use anchor_lang::prelude::*;

#[account]
pub struct ProjectAccount {
    pub project_id:             u64,             
    pub registry:               Pubkey,          
    pub creator:                Pubkey,          
    pub name:                   String,          
    pub symbol:                 String,          
    pub uri:                    String,          
    pub supply_cap:             u64,             
    pub tokens_issued:          u64,             
    pub min_investment_usdc:    u64,             
    pub max_investment_usdc:    u64,             
    pub accepted_stablecoin:    Pubkey,          
    pub treasury_wallet:        Pubkey,          
    pub mint:                   Pubkey,          
    pub lockup_end_ts:          i64,             
    pub subscription_start:     i64,             
    pub subscription_end:       i64,             
    pub created_at:             i64,             
    pub distribution_cadence:   u8,              
    pub is_active:              bool,            
    pub is_paused:              bool,            
    pub mint_authority_revoked: bool,            
    pub bump:                   u8,              
}

impl ProjectAccount {
    pub const SIZE: usize = 8 + 8 + 32 + 32 + (4 + 64) + (4 + 10) + (4 + 200) + 8 + 8 + 8 + 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 1 + 1 + 64;
}

use anchor_lang::prelude::*;

// ─── Shadow Enums ────────────────────────────────────────────────────────────
// These must match the variants in the Registry Program exactly for 
// successful deserialization.

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ExternalProjectStatus {
    Draft,
    Funding,
    Active,
    Completed,
    Canceled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ExternalAssetType {
    RealEstate,
    Mining,
    Other,
}

// ─── Shadow Project Account ──────────────────────────────────────────────────
// This is a "Mirror" of the ProjectAccount in the registry_program.
// We use this to read treasury and supply data on-chain without a Cargo dependency.
#[account]
pub struct ShadowProjectAccount {
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
    pub duration_months:        u8,
    pub status:                 ExternalProjectStatus,
    pub is_paused:              bool,
    pub mint_authority_revoked: bool,
    pub round_limit_tokens:     u64,
    pub current_round_issued:   u64,
    pub asset_type:             ExternalAssetType,
    pub bump:                   u8,
}

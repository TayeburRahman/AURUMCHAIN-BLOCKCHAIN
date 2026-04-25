use anchor_lang::prelude::*;

// ─── Lifecycle Phase ──────────────────────────────────────────────────────────
// Replaces the old `is_active: bool`. A project moves through these stages
// in order. `is_paused` is a separate "Emergency Brake" that can freeze any
// stage without losing its place (e.g. a Funding project stays Funding when
// paused — it is NOT cancelled).
//
//  Draft     → project created, not yet open for investment
//  Funding   → subscription window is open, tokens can be minted to investors
//  Funded    → funding complete, goal met (Grace Period)
//  Active    → funding complete, project is running (lockup may apply)
//  Completed → project finished, distributions done
//  Canceled  → project was abandoned; no new actions allowed
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ProjectStatus {
    Draft,
    Funding,
    Funded,
    Active,
    Completed,
    Canceled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum DistributionMode {
    Parallel,
    Sequential,
}

// ─── Asset Type ───────────────────────────────────────────────────────────────
// Used by the Dashboard to apply UI presets and by `issue_tokens` to determine
// the default round_limit_tokens behaviour:
//   RealEstate → 100% (full supply minted upfront)
//   Mining     → variable percentage per round
//   Other      → custom, set manually by admin
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum AssetType {
    RealEstate,
    Mining,
    Other,
}

// ─── Project Account ─────────────────────────────────────────────────────────
#[account]
pub struct ProjectAccount {
    pub project_id:             u64,
    pub registry:               Pubkey,
    pub creator:                Pubkey,
    pub name:                   String,          // max MAX_NAME_LEN bytes
    pub symbol:                 String,          // max MAX_SYMBOL_LEN bytes
    pub uri:                    String,          // max MAX_URI_LEN bytes
    pub supply_cap:             u64,             // total tokens that can ever exist
    pub tokens_issued:          u64,             // lifetime cumulative issued
    pub min_investment_usdc:    u64,
    pub max_investment_usdc:    u64,
    pub token_price_usdc:       u64,             // Micro-USDC (e.g. 1,000,000 = $1)
    pub accepted_stablecoin:    Pubkey,
    pub treasury_wallet:        Pubkey,
    pub mint:                   Pubkey,          // SPL mint address (set after creation)
    pub lockup_end_ts:          i64,
    pub subscription_start:     i64,
    pub subscription_end:       i64,
    pub created_at:             i64,
    pub distribution_cadence:   u8,
    pub duration_months:        u8,
    pub distribution_mode:      u8,              // 0=Parallel, 1=Sequential

    // ── New Phase-Control Fields ──────────────────────────────────────────────
    // status replaces the old `is_active: bool`. See ProjectStatus above.
    pub status:                 ProjectStatus,
    // Emergency brake — independent of status. Pausing a Funding project does
    // NOT cancel it; it simply freezes it until an admin resumes it.
    pub is_paused:              bool,
    // Set to true permanently once revoke_mint_authority is called.
    pub mint_authority_revoked: bool,
    // Max tokens mintable in the current round (0 = uncapped within supply_cap).
    pub round_limit_tokens:     u64,
    // Tokens issued in the current round (reset by admin via reset_round).
    pub current_round_issued:   u64,
    pub asset_type:             AssetType,
    pub bump:                   u8,

    /// ── FUTURE EXPANSION PADDING ─────────────────────────────────────────────
    /// Any new fields (e.g., Buyback Price, Marketplace Fees) MUST be added here
    /// by reducing this padding. This ensures cross-program byte-alignment
    /// remains 100% consistent across redeployments.
    pub padding:                [u8; 42], 
}

impl ProjectAccount {
    pub const MAX_NAME_LEN:   usize = 64;
    pub const MAX_SYMBOL_LEN: usize = 10;
    pub const MAX_URI_LEN:    usize = 200;

    // SIZE calculation (discriminator + every field):
    //   8   discriminator
    //   8   project_id
    //   32  registry
    //   32  creator
    //   68  name   (4 len prefix + 64 bytes)
    //   14  symbol (4 len prefix + 10 bytes)
    //   204 uri    (4 len prefix + 200 bytes)
    //   8   supply_cap
    //   8   tokens_issued
    //   8   min_investment_usdc
    //   8   max_investment_usdc
    //   32  accepted_stablecoin
    //   32  treasury_wallet
    //   32  mint
    //   8   lockup_end_ts
    //   8   subscription_start
    //   8   subscription_end
    //   8   created_at
    //   1   distribution_cadence
    //   1   status          (enum → 1 byte variant tag)
    //   1   is_paused
    //   1   mint_authority_revoked
    //   8   round_limit_tokens
    //   8   current_round_issued
    //   1   asset_type      (enum → 1 byte variant tag)
    //   1   bump
    //  64   padding (alignment buffer)
    // ────────────────────────────────────────────────
    pub const SIZE: usize =
        8           // discriminator
        + 8         // project_id
        + 32        // registry
        + 32        // creator
        + (4 + 64)  // name
        + (4 + 10)  // symbol
        + (4 + 200) // uri
        + 8         // supply_cap
        + 8         // tokens_issued
        + 8         // min_investment_usdc
        + 8         // max_investment_usdc
        + 8         // token_price_usdc
        + 32        // accepted_stablecoin
        + 32        // treasury_wallet
        + 32        // mint
        + 8         // lockup_end_ts
        + 8         // subscription_start
        + 8         // subscription_end
        + 8         // created_at
        + 1         // distribution_cadence
        + 1         // duration_months
        + 1         // distribution_mode
        + 1         // status (ProjectStatus variant)
        + 1         // is_paused
        + 1         // mint_authority_revoked
        + 8         // round_limit_tokens
        + 8         // current_round_issued
        + 1         // asset_type (AssetType variant)
        + 1         // bump
        + 42;       // alignment padding (Total 600 bytes)
}


use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// MIRROR OF project_registry::state::ProjectAccount
//
// CRITICAL: This struct is deserialized manually from raw on-chain bytes in
// subscribe_investment.rs. The field ORDER and TYPES here MUST be byte-perfect
// identical to the ProjectAccount defined in the project_registry program.
// Any mismatch will silently produce corrupted data — do not reorder fields.
// ─────────────────────────────────────────────────────────────────────────────

// Mirror of ProjectStatus enum — variant order must match exactly.
//   0 = Draft, 1 = Funding, 2 = Active, 3 = Completed, 4 = Canceled
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ProjectStatus {
    Draft,
    Funding,
    Funded,
    Active,
    Completed,
    Canceled,
}

// Mirror of AssetType enum — variant order must match exactly.
//   0 = RealEstate, 1 = Mining, 2 = Other
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum AssetType {
    RealEstate,
    Mining,
    Other,
}

// Mirror struct — field order must be identical to the registry's ProjectAccount.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
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
    pub token_price_usdc:       u64,             // Added
    pub accepted_stablecoin:    Pubkey,
    pub treasury_wallet:        Pubkey,
    pub mint:                   Pubkey,
    pub lockup_end_ts:          i64,
    pub subscription_start:     i64,
    pub subscription_end:       i64,
    pub created_at:             i64,
    pub distribution_cadence:   u8,
    pub duration_months:        u8,
    pub distribution_mode:      u8,              // Added
    pub status:                 ProjectStatus,
    pub is_paused:              bool,
    pub mint_authority_revoked: bool,
    pub round_limit_tokens:     u64,
    pub current_round_issued:   u64,
    pub asset_type:             AssetType,
    pub bump:                   u8,

    /// ── FUTURE EXPANSION PADDING ─────────────────────────────────────────────
    /// DO NOT REORDER. Add new fields here and reduce padding to match.
    pub padding:                [u8; 42],
}

impl ProjectAccount {
    #[allow(dead_code)]
    // SIZE must match ProjectAccount::SIZE in project_registry exactly.
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

// Manual Default implementation to handle [u8; 42]
impl Default for ProjectAccount {
    fn default() -> Self {
        Self {
            project_id:             0,
            registry:               Pubkey::default(),
            creator:                Pubkey::default(),
            name:                   String::default(),
            symbol:                 String::default(),
            uri:                    String::default(),
            supply_cap:             0,
            tokens_issued:          0,
            min_investment_usdc:    0,
            max_investment_usdc:    0,
            token_price_usdc:       0,
            accepted_stablecoin:    Pubkey::default(),
            treasury_wallet:        Pubkey::default(),
            mint:                   Pubkey::default(),
            lockup_end_ts:          0,
            subscription_start:     0,
            subscription_end:       0,
            created_at:             0,
            distribution_cadence:   0,
            duration_months:        0,
            distribution_mode:      0,
            status:                 ProjectStatus::default(),
            is_paused:              false,
            mint_authority_revoked: false,
            round_limit_tokens:     0,
            current_round_issued:   0,
            asset_type:             AssetType::default(),
            bump:                   0,
            padding:                [0u8; 42],
        }
    }
}

// Default impl for ProjectStatus (needed by #[derive(Default)] on ProjectAccount).
impl Default for ProjectStatus {
    fn default() -> Self { ProjectStatus::Draft }
}

// Default impl for AssetType.
impl Default for AssetType {
    fn default() -> Self { AssetType::RealEstate }
}


use anchor_lang::prelude::*;

mod state;
mod registry_logic;

use crate::registry_logic::*;
use crate::state::*;

declare_id!("GcXxLjcCm7ov3i6QqQsL8zgjqiknWBswXn6jcwpEMYdC");

#[program]
pub mod project_registry {
    use super::*;

    pub fn initialize_control(
        ctx:                Context<InitializeControl>,
        operational_admin:  Pubkey,
        operational_limits: u64,
    ) -> Result<()> {
        handle_initialize_control(ctx, operational_admin, operational_limits)
    }

    pub fn create_project(
        ctx:    Context<CreateProject>,
        params: CreateProjectParams,
    ) -> Result<()> {
        handle_create_project(ctx, params)
    }

    pub fn set_project_mint(
        ctx:      Context<SetProjectMint>,
        mint_key: Pubkey,
    ) -> Result<()> {
        handle_set_project_mint(ctx, mint_key)
    }

    pub fn revoke_mint_authority(ctx: Context<RevokeMintAuthority>) -> Result<()> {
        handle_revoke_mint_authority(ctx)
    }

    pub fn update_project_params(
        ctx:    Context<UpdateProjectParams>,
        params: ProjectUpdateParams,
    ) -> Result<()> {
        handle_update_project_params(ctx, params)
    }

    pub fn update_project_status(
        ctx:        Context<UpdateProjectStatus>,
        project_id: u64,
        new_status: ProjectStatus,
        is_paused:  bool,
    ) -> Result<()> {
        handle_update_project_status(ctx, project_id, new_status, is_paused)
    }

    pub fn record_tokens_issued(
        ctx:    Context<RecordTokensIssued>,
        amount: u64,
    ) -> Result<()> {
        handle_record_tokens_issued(ctx, amount)
    }

    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        role_flag:  u8,
        new_limits: Option<u64>,
    ) -> Result<()> {
        handle_transfer_authority(ctx, role_flag, new_limits)
    }

    pub fn set_emergency_pause(
        ctx: Context<SetEmergencyPause>,
        is_paused: bool,
    ) -> Result<()> {
        handle_set_emergency_pause(ctx, is_paused)
    }

    pub fn calibrate_registry(
        ctx: Context<CalibrateRegistry>,
        new_count: u64,
    ) -> Result<()> {
        handle_calibrate_registry(ctx, new_count)
    }

    /// Mint tokens directly to an investor's wallet (Direct-to-Wallet delivery).
    /// Guards: Funding status, not paused, supply cap, round limit, authority not revoked.
    pub fn issue_tokens(
        ctx:    Context<IssueTokens>,
        amount: u64,
    ) -> Result<()> {
        handle_issue_tokens(ctx, amount)
    }

    /// Reset the current-round counter and optionally set a new round cap.
    /// Used by phased (e.g. Mining) projects to open the next issuance round.
    pub fn reset_round(
        ctx:             Context<ResetRound>,
        new_round_limit: Option<u64>,
    ) -> Result<()> {
        handle_reset_round(ctx, new_round_limit)
    }
}

#[error_code]
pub enum RegistryError {
    #[msg("Caller is not authorized to perform this action")]
    Unauthorized,
    #[msg("String field exceeds the maximum allowed byte length")]
    StringTooLong,
    #[msg("CPI caller is not an authorized program or signer")]
    UnauthorizedCpiCaller,
    #[msg("min_investment must be <= max_investment")]
    InvalidThresholds,
    #[msg("Supply cap must be greater than zero")]
    ZeroSupplyCap,
    #[msg("subscription_end must be after subscription_start")]
    InvalidSubscriptionWindow,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Mint address is already set for this project")]
    MintAlreadySet,
    #[msg("Provided mint key is invalid (default pubkey)")]
    InvalidMint,
    #[msg("Mint authority has already been revoked")]
    MintAuthorityAlreadyRevoked,
    #[msg("Token issuance would exceed the project supply cap")]
    SupplyCapExceeded,
    #[msg("Action exceeds the allowed operational limits")]
    ExceedsOperationalLimit,
    #[msg("Cannot transition from a terminal state (Completed / Canceled)")]
    InvalidStatusTransition,
    #[msg("Mint address must be set before moving to Funding status")]
    MintNotSet,
    #[msg("Token issuance would exceed the current round limit")]
    RoundLimitExceeded,
    #[msg("The lock-up end date can only be extended, not reduced.")]
    LockupCannotBeReduced,
}
use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("GcXxLjcCm7ov3i6QqQsL8zgjqiknWBswXn6jcwpEMYdC");

#[program]
pub mod project_registry {
    use super::*;

    pub fn initialize_registry(
        ctx: Context<InitializeRegistry>,
        super_admin: Pubkey,
    ) -> Result<()> {
        instructions::initialize_registry::handler(ctx, super_admin)
    }

    pub fn create_project(
        ctx:    Context<CreateProject>,
        params: CreateProjectParams,
    ) -> Result<()> {
        instructions::create_project::handler(ctx, params)
    }

    pub fn set_project_mint(
        ctx:      Context<SetProjectMint>,
        mint_key: Pubkey,
    ) -> Result<()> {
        instructions::set_project_mint::handler(ctx, mint_key)
    }

    pub fn revoke_mint_authority(ctx: Context<RevokeMintAuthority>) -> Result<()> {
        instructions::revoke_mint_authority::handler(ctx)
    }

    pub fn update_project_params(
        ctx:    Context<UpdateProjectParams>,
        params: ProjectUpdateParams,
    ) -> Result<()> {
        instructions::update_project_params::handler(ctx, params)
    }

    // AC-BC-102: Unified project status control
    pub fn update_project_status(
        ctx:        Context<UpdateProjectStatus>,
        project_id: u64,
        is_active:  bool,
        is_paused:  bool,
    ) -> Result<()> {
        instructions::update_project_status::handler(ctx, project_id, is_active, is_paused)
    }

    pub fn record_tokens_issued(
        ctx:    Context<RecordTokensIssued>,
        amount: u64,
    ) -> Result<()> {
        instructions::record_tokens_issued::handler(ctx, amount)
    }

    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_super_admin: Option<Pubkey>,
        new_authority:   Option<Pubkey>,
    ) -> Result<()> {
        instructions::transfer_authority::handler(ctx, new_super_admin, new_authority)
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
}
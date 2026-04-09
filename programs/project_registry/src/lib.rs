use anchor_lang::prelude::*;

declare_id!("3d8e3RRhmkh6RTKbKskePybmtxej6kTUjfX594sMxQ8D");

#[program]
pub mod project_registry {
    use super::*;

    // --------------------------------------------------------
    // Instruction 1: initialize_registry
    // --------------------------------------------------------
    pub fn initialize_registry(
        ctx: Context<InitializeRegistry>,
        super_admin: Pubkey,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority        = ctx.accounts.payer.key();
        registry.super_admin      = super_admin;
        registry.project_count    = 0;
        registry.bump             = ctx.bumps.registry;

        emit!(RegistryInitialized {
            authority:   registry.authority,
            super_admin: registry.super_admin,
        });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 2: create_project
    // --------------------------------------------------------
    pub fn create_project(
        ctx:    Context<CreateProject>,
        params: CreateProjectParams,
    ) -> Result<()> {
        // Guard 1: string length bounds
        require!(
            params.name.len() <= ProjectAccount::MAX_NAME_LEN,
            RegistryError::StringTooLong
        );
        require!(
            params.symbol.len() <= ProjectAccount::MAX_SYMBOL_LEN,
            RegistryError::StringTooLong
        );
        require!(
            params.uri.len() <= ProjectAccount::MAX_URI_LEN,
            RegistryError::StringTooLong
        );

        // Guard 2: numeric / business-logic ranges
        require!(
            params.min_investment_usdc <= params.max_investment_usdc,
            RegistryError::InvalidThresholds
        );
        require!(params.supply_cap > 0, RegistryError::ZeroSupplyCap);
        require!(
            params.subscription_end > params.subscription_start,
            RegistryError::InvalidSubscriptionWindow
        );

        let registry = &mut ctx.accounts.registry;
        let project  = &mut ctx.accounts.project;

        // Assign sequential ID and bump the counter
        let project_id = registry.project_count;
        registry.project_count = registry.project_count
            .checked_add(1)
            .ok_or(RegistryError::Overflow)?;

        // Populate project account
        project.project_id          = project_id;
        project.registry            = registry.key();
        project.creator             = ctx.accounts.admin.key();
        project.name                = params.name;
        project.symbol              = params.symbol;
        project.uri                 = params.uri;
        project.supply_cap          = params.supply_cap;
        project.min_investment_usdc = params.min_investment_usdc;
        project.max_investment_usdc = params.max_investment_usdc;
        project.accepted_stablecoin = params.accepted_stablecoin;
        project.treasury_wallet     = params.treasury_wallet;
        project.lockup_end_ts       = params.lockup_end_ts;
        project.subscription_start  = params.subscription_start;
        project.subscription_end    = params.subscription_end;
        project.distribution_cadence = params.distribution_cadence;
        project.tokens_issued       = 0;
        project.is_active           = true;
        project.investments_paused  = false;
        project.transfers_paused    = false;
        project.mint_authority_revoked = false;
        project.mint                = Pubkey::default(); 
        project.bump                = ctx.bumps.project;

        emit!(ProjectCreated {
            project_id,
            name:            project.name.clone(),
            supply_cap:      project.supply_cap,
            treasury_wallet: project.treasury_wallet,
        });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 3: set_project_mint
    // --------------------------------------------------------
    pub fn set_project_mint(
        ctx:      Context<UpdateProject>,
        mint_key: Pubkey,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;

        require!(
            project.mint == Pubkey::default(),
            RegistryError::MintAlreadySet
        );
        require!(mint_key != Pubkey::default(), RegistryError::InvalidMint);

        project.mint = mint_key;

        emit!(MintRegistered {
            project_id: project.project_id,
            mint:       mint_key,
        });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 4: revoke_mint_authority
    // --------------------------------------------------------
    pub fn revoke_mint_authority(ctx: Context<SuperAdminAction>) -> Result<()> {
        let project = &mut ctx.accounts.project;

        require!(
            !project.mint_authority_revoked,
            RegistryError::MintAuthorityAlreadyRevoked
        );

        project.mint_authority_revoked = true;

        emit!(MintAuthorityRevoked {
            project_id: project.project_id,
            mint:       project.mint,
        });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 5: update_project_params
    // --------------------------------------------------------
    // RENAME: Changed params from UpdateProjectParams to ProjectUpdateParams to avoid collision
    pub fn update_project_params(
        ctx:    Context<UpdateProject>,
        params: ProjectUpdateParams,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;

        if let (Some(start), Some(end)) = (params.subscription_start, params.subscription_end) {
            require!(end > start, RegistryError::InvalidSubscriptionWindow);
            project.subscription_start = start;
            project.subscription_end   = end;
        }

        if let Some(min) = params.min_investment_usdc {
            project.min_investment_usdc = min;
        }
        if let Some(max) = params.max_investment_usdc {
            project.max_investment_usdc = max;
        }
        if let Some(cadence) = params.distribution_cadence {
            project.distribution_cadence = cadence;
        }
        if let Some(lockup) = params.lockup_end_ts {
            project.lockup_end_ts = lockup;
        }

        emit!(ProjectUpdated { project_id: project.project_id });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 6: pause_investments
    // --------------------------------------------------------
    pub fn pause_investments(
        ctx:    Context<UpdateProject>,
        paused: bool,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.investments_paused = paused;

        emit!(PauseStateChanged {
            project_id:         project.project_id,
            investments_paused: project.investments_paused,
            transfers_paused:   project.transfers_paused,
        });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 7: pause_transfers
    // --------------------------------------------------------
    pub fn pause_transfers(
        ctx:    Context<UpdateProject>,
        paused: bool,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.transfers_paused = paused;

        emit!(PauseStateChanged {
            project_id:         project.project_id,
            investments_paused: project.investments_paused,
            transfers_paused:   project.transfers_paused,
        });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 8: set_project_active
    // --------------------------------------------------------
    pub fn set_project_active(
        ctx:       Context<SuperAdminAction>,
        is_active: bool,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.is_active = is_active;

        emit!(ProjectStatusChanged {
            project_id: project.project_id,
            is_active,
        });

        Ok(())
    }

    // --------------------------------------------------------
    // Instruction 9: record_tokens_issued
    // --------------------------------------------------------
    pub fn record_tokens_issued(
        ctx:    Context<InternalCpiAction>,
        amount: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;

        let new_total = project.tokens_issued
            .checked_add(amount)
            .ok_or(RegistryError::Overflow)?;

        require!(
            new_total <= project.supply_cap,
            RegistryError::SupplyCapExceeded
        );

        project.tokens_issued = new_total;

        emit!(TokensIssued {
            project_id:    project.project_id,
            amount_issued: amount,
            total_issued:  project.tokens_issued,
            supply_cap:    project.supply_cap,
        });

        Ok(())
    }
}

// ============================================================
// ACCOUNT CONTEXTS
// ============================================================

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer  = payer,
        space  = RegistryConfig::SIZE,
        seeds  = [b"registry"],
        bump
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(params: CreateProjectParams)]
pub struct CreateProject<'info> {
    #[account(
        mut,
        seeds = [b"registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(
        init,
        payer = admin,
        space = ProjectAccount::SIZE,
        seeds = [b"project", registry.project_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        mut,
        constraint = (
            admin.key() == registry.authority ||
            admin.key() == registry.super_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProject<'info> {
    #[account(
        seeds = [b"registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump  = project.bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        constraint = (
            admin.key() == registry.authority ||
            admin.key() == registry.super_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct SuperAdminAction<'info> {
    #[account(
        seeds = [b"registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump  = project.bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        constraint = super_admin.key() == registry.super_admin @ RegistryError::Unauthorized
    )]
    pub super_admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct InternalCpiAction<'info> {
    #[account(
        seeds = [b"registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump  = project.bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        constraint = caller.key() == registry.authority @ RegistryError::UnauthorizedCpiCaller
    )]
    pub caller: Signer<'info>,
}

// ============================================================
// STATE ACCOUNTS
// ============================================================

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
    pub distribution_cadence:   u32,
    pub is_active:              bool,
    pub investments_paused:     bool,
    pub transfers_paused:       bool,
    pub mint_authority_revoked: bool,
    pub bump:                   u8,
}

impl ProjectAccount {
    pub const MAX_NAME_LEN:   usize = 64;
    pub const MAX_SYMBOL_LEN: usize = 10;
    pub const MAX_URI_LEN:    usize = 200;

    pub const SIZE: usize =
        8
        + 8
        + 32
        + 32
        + (4 + 64)
        + (4 + 10)
        + (4 + 200)
        + 8
        + 8
        + 8
        + 8
        + 32
        + 32
        + 32
        + 8
        + 8
        + 8
        + 4
        + 1
        + 1
        + 1
        + 1
        + 1
        + 64;
}

// ============================================================
// PARAMETERS (instruction data)
// ============================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateProjectParams {
    pub name:                   String,
    pub symbol:                 String,
    pub uri:                    String,
    pub supply_cap:             u64,
    pub min_investment_usdc:    u64,
    pub max_investment_usdc:    u64,
    pub accepted_stablecoin:    Pubkey,
    pub treasury_wallet:        Pubkey,
    pub lockup_end_ts:          i64,
    pub subscription_start:     i64,
    pub subscription_end:       i64,
    pub distribution_cadence:   u32,
}

// RENAME: Fixed to ProjectUpdateParams
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProjectUpdateParams {
    pub min_investment_usdc:    Option<u64>,
    pub max_investment_usdc:    Option<u64>,
    pub subscription_start:     Option<i64>,
    pub subscription_end:       Option<i64>,
    pub distribution_cadence:   Option<u32>,
    pub lockup_end_ts:          Option<i64>,
}

// ============================================================
// EVENTS
// ============================================================

#[event]
pub struct RegistryInitialized {
    pub authority:   Pubkey,
    pub super_admin: Pubkey,
}

#[event]
pub struct ProjectCreated {
    pub project_id:      u64,
    pub name:            String,
    pub supply_cap:      u64,
    pub treasury_wallet: Pubkey,
}

#[event]
pub struct ProjectUpdated {
    pub project_id: u64,
}

#[event]
pub struct ProjectStatusChanged {
    pub project_id: u64,
    pub is_active:  bool,
}

#[event]
pub struct MintRegistered {
    pub project_id: u64,
    pub mint:       Pubkey,
}

#[event]
pub struct MintAuthorityRevoked {
    pub project_id: u64,
    pub mint:       Pubkey,
}

#[event]
pub struct PauseStateChanged {
    pub project_id:         u64,
    pub investments_paused: bool,
    pub transfers_paused:   bool,
}

#[event]
pub struct TokensIssued {
    pub project_id:    u64,
    pub amount_issued: u64,
    pub total_issued:  u64,
    pub supply_cap:    u64,
}

// ============================================================
// ERRORS
// ============================================================

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
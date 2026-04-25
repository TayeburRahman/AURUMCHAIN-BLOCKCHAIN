use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateProjectParams {
    pub name:                   String,
    pub symbol:                 String,
    pub uri:                    String,
    pub supply_cap:             u64,
    pub min_investment_usdc:    u64,
    pub max_investment_usdc:    u64,
    pub token_price_usdc:       u64,             // Micro-USDC (e.g. 1,000,000 = $1)
    pub accepted_stablecoin:    Pubkey,
    pub treasury_wallet:        Pubkey,
    pub lockup_end_ts:          i64,
    pub subscription_start:     i64,
    pub subscription_end:       i64,
    pub distribution_cadence:   u8,
    pub duration_months:        u8,
    pub distribution_mode:      u8,              // 0=Parallel, 1=Sequential
    // ── Phase fields ──────────────────────────────────────────────────────────
    // asset_type drives UI presets & default round_limit behaviour.
    pub asset_type:             AssetType,
    // Max tokens mintable in the first round (0 = full supply_cap, i.e. Real Estate default).
    pub round_limit_tokens:     u64,
}

#[derive(Accounts)]
#[instruction(params: CreateProjectParams)]
pub struct CreateProject<'info> {
    #[account(
        mut,
        seeds = [b"control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(
        init_if_needed,
        payer = admin,
        space = ProjectAccount::SIZE,
        seeds = [b"project", control.project_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        mut,
        constraint = (
            admin.key() == control.super_admin ||
            admin.key() == control.operational_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        space = MintAuthorityAccount::SIZE,
        seeds = [b"mint_authority", control.project_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub mint_authority_pda: Account<'info, MintAuthorityAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_project(
    ctx:    Context<CreateProject>,
    params: CreateProjectParams,
) -> Result<()> {
    // SECURITY: Global Pause Check
    require!(!ctx.accounts.control.is_emergency_paused, RegistryError::Unauthorized);

    let auth    = &mut ctx.accounts.mint_authority_pda;

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

    let control = &mut ctx.accounts.control;
    let project = &mut ctx.accounts.project;

    // Safety Cap check for operational admin
    if ctx.accounts.admin.key() == control.operational_admin && 
       ctx.accounts.admin.key() != control.super_admin {
        require!(
            params.supply_cap <= control.operational_limits,
            RegistryError::ExceedsOperationalLimit
        );
    }

    // Assign sequential ID and bump the counter
    let project_id = control.project_count;
    control.project_count = control.project_count
        .checked_add(1)
        .ok_or(RegistryError::Overflow)?;

    // Initialize Auth Account
    auth.project_id = project_id;
    auth.bump = ctx.bumps.mint_authority_pda;

    let clock = Clock::get()?;

    // Populate project account
    project.project_id          = project_id;
    project.registry            = control.key();
    project.creator             = ctx.accounts.admin.key();
    project.name                = params.name;
    project.symbol              = params.symbol;
    project.uri                 = params.uri;
    project.supply_cap          = params.supply_cap;
    project.min_investment_usdc = params.min_investment_usdc;
    project.max_investment_usdc = params.max_investment_usdc;
    project.token_price_usdc    = params.token_price_usdc;
    project.accepted_stablecoin = params.accepted_stablecoin;
    project.treasury_wallet     = params.treasury_wallet;
    project.lockup_end_ts       = params.lockup_end_ts;
    project.subscription_start  = params.subscription_start;
    project.subscription_end    = params.subscription_end;
    project.distribution_cadence = params.distribution_cadence;
    project.duration_months      = params.duration_months;
    project.distribution_mode    = params.distribution_mode;
    project.created_at             = clock.unix_timestamp;
    project.tokens_issued          = 0;
    // New projects start as Draft — admin must explicitly move to Funding.
    project.status                 = ProjectStatus::Draft;
    project.is_paused              = false;
    project.mint_authority_revoked = false;
    project.mint                   = Pubkey::default();
    // Phase / round fields
    project.asset_type             = params.asset_type;
    project.round_limit_tokens     = params.round_limit_tokens;
    project.current_round_issued   = 0;
    project.bump                   = ctx.bumps.project;

    emit!(ProjectCreated {
        project_id,
        name:            project.name.clone(),
        supply_cap:      project.supply_cap,
        treasury_wallet: project.treasury_wallet,
    });

    Ok(())
}

#[event]
pub struct ProjectCreated {
    pub project_id:      u64,
    pub name:            String,
    pub supply_cap:      u64,
    pub treasury_wallet: Pubkey,
}

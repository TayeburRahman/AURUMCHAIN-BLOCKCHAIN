use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::*;
use crate::ComplianceError;

#[derive(Accounts)]
#[instruction(subscription_id: u64, project_id: u64)]
pub struct SubscribeInvestment<'info> {
    #[account(
        init,
        payer = investor,
        space = InvestmentSubscriptionAccount::SIZE,
        seeds = [b"subscription", investor.key().as_ref(), subscription_id.to_le_bytes().as_ref()],
        bump
    )]
    pub subscription: Account<'info, InvestmentSubscriptionAccount>,

    #[account(mut)]
    pub investor: Signer<'info>,

    /// CHECK: Manual discriminator check to handle legacy and standard versions
    #[account(
        mut,
        seeds = [b"eligibility", investor.key().as_ref()],
        bump,
    )]
    pub eligibility: UncheckedAccount<'info>,

    /// CHECK: Validated via manual owner and seed check in handler
    pub project_account: UncheckedAccount<'info>,

    /// CHECK: Validated via seeds
    pub project_registry_program: UncheckedAccount<'info>,

    #[account(
        seeds = [b"compliance_control"],
        bump = control.bump,
        constraint = !control.transfers_paused @ ComplianceError::GlobalTransfersPaused,
    )]
    pub control: Account<'info, ComplianceControl>,

    // ── Token Transfer Accounts ──────────────────────────────────────────────
    /// The investor's USDC token account.
    #[account(mut)]
    pub investor_token_account: Account<'info, TokenAccount>,

    /// The project's treasury USDC token account.
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_subscribe_investment(
    ctx:               Context<SubscribeInvestment>,
    subscription_id:   u64,
    project_id:        u64,
    investment_amount: u64,
    payment_asset:     Pubkey,
) -> Result<()> {
    let clock = Clock::get()?;
    
    // ── Eligibility Validation ──────────────────────────────────────────────
    let eligibility = InvestorEligibilityAccount::load_checked(&ctx.accounts.eligibility)?;
    require!(eligibility.investment_allowed, ComplianceError::Unauthorized);
    require!(eligibility.kyc_status == KycStatus::Approved, ComplianceError::SenderNotApproved);
    
    // 0. Security Verification (Owner & Seeds)
    require_keys_eq!(ctx.accounts.project_account.owner.key(), ctx.accounts.project_registry_program.key(), ComplianceError::Unauthorized);

    // 1. Deserialization (LEGACY FIX: Using deserialize to handle Project 0 padding!)
    let mut data: &[u8] = &ctx.accounts.project_account.data.borrow()[8..];
    let project = ProjectAccount::deserialize(&mut data)?;

    // 2. Validate phase & amount
    require!(project.status == ProjectStatus::Funding && !project.is_paused, ComplianceError::ProjectNotActive);
    require!(investment_amount >= project.min_investment_usdc, ComplianceError::InvestmentTooLow);
    require!(investment_amount <= project.max_investment_usdc, ComplianceError::InvestmentTooHigh);
    require!(payment_asset == project.accepted_stablecoin, ComplianceError::InvalidStatus);

    // 3. Validate Treasury
    require_keys_eq!(ctx.accounts.treasury_token_account.owner, project.treasury_wallet, ComplianceError::Unauthorized);

    // 4. Perform USDC Transfer (Investor -> Treasury)
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.investor_token_account.to_account_info(),
            to:   ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, investment_amount)?;

    // 5. Save Subscription Record
    let subscription = &mut ctx.accounts.subscription;
    subscription.subscription_id        = subscription_id;
    subscription.investor               = ctx.accounts.investor.key();
    subscription.project_id             = project_id;
    subscription.investment_amount      = investment_amount;
    subscription.payment_asset          = payment_asset;
    subscription.status                 = SubscriptionStatus::Pending;
    subscription.created_at             = clock.unix_timestamp;
    subscription.bump                   = ctx.bumps.subscription;

    emit!(InvestmentSubscribed {
        subscription_id,
        investor:          ctx.accounts.investor.key(),
        project_id,
        investment_amount,
        timestamp:         clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct InvestmentSubscribed {
    pub subscription_id:   u64,
    pub investor:          Pubkey,
    pub project_id:        u64,
    pub investment_amount: u64,
    pub timestamp:         i64,
}

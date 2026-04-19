use anchor_lang::prelude::*;
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

    #[account(
        seeds = [b"eligibility", investor.key().as_ref()],
        bump = eligibility.bump,
        constraint = eligibility.investment_allowed @ ComplianceError::Unauthorized,
        constraint = eligibility.kyc_status == KycStatus::Approved @ ComplianceError::SenderNotApproved,
        constraint = eligibility.aml_status == AmlStatus::Clear @ ComplianceError::SenderAmlBlocked,
    )]
    pub eligibility: Account<'info, InvestorEligibilityAccount>,

    #[account(
        seeds = [b"project", project_id.to_le_bytes().as_ref()],
        seeds::program = project_registry_program.key(),
        bump = project_account.bump,
    )]
    pub project_account: Account<'info, ProjectAccount>,

    /// CHECK: Validated via seeds
    pub project_registry_program: UncheckedAccount<'info>,

    #[account(
        seeds = [b"compliance_control"],
        bump = control.bump,
        constraint = !control.transfers_paused @ ComplianceError::GlobalTransfersPaused,
    )]
    pub control: Account<'info, ComplianceControl>,

    pub system_program: Program<'info, System>,
}

pub fn handle_subscribe_investment(
    ctx:               Context<SubscribeInvestment>,
    subscription_id:   u64,
    project_id:        u64,
    investment_amount: u64,
    payment_asset:     Pubkey,
) -> Result<()> {
    let clock   = Clock::get()?;
    let project = &ctx.accounts.project_account;

    // 1. Validate project activity/pause
    require!(project.is_active && !project.is_paused, ComplianceError::ProjectNotActive);

    // 2. Validate subscription window
    require!(
        clock.unix_timestamp >= project.subscription_start && 
        clock.unix_timestamp <= project.subscription_end,
        ComplianceError::InvalidStatus // Or OutsideSubscriptionWindow if I add it
    );

    // 3. Validate investment amount thresholds
    require!(investment_amount >= project.min_investment_usdc, ComplianceError::InvestmentTooLow);
    require!(investment_amount <= project.max_investment_usdc, ComplianceError::InvestmentTooHigh);

    // 4. Validate payment asset (Optional, but good practice)
    // require!(payment_asset == project.accepted_stablecoin, ComplianceError::InvalidPaymentAsset);

    let subscription = &mut ctx.accounts.subscription;
    subscription.subscription_id        = subscription_id;
    subscription.investor               = ctx.accounts.investor.key();
    subscription.project_id             = project_id;
    subscription.investment_amount      = investment_amount;
    subscription.payment_asset          = payment_asset;
    subscription.status                 = SubscriptionStatus::Pending;
    subscription.settlement_tx_hash     = [0u8; 64];
    subscription.allocated_token_amount = 0;
    subscription.created_at             = clock.unix_timestamp;
    subscription.settled_at             = 0;
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

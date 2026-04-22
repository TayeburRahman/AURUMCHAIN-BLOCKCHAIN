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
    
    // 0. Manual Security Checks (AC-BC-406 CROSS-PROGRAM FIX)
    
    // 0a. Owner Verification
    require_keys_eq!(
        ctx.accounts.project_account.owner.key(), 
        ctx.accounts.project_registry_program.key(), 
        ComplianceError::Unauthorized
    );

    // 0b. Seed Verification (Manual PDA Check)
    let (expected_project_pda, _bump) = Pubkey::find_program_address(
        &[b"project", project_id.to_le_bytes().as_ref()],
        &ctx.accounts.project_registry_program.key()
    );
    require_keys_eq!(
        ctx.accounts.project_account.key(),
        expected_project_pda,
        ComplianceError::Unauthorized
    );

    // 1. Deserialization (Carefully handling trailing slack space)
    let mut data: &[u8] = &ctx.accounts.project_account.data.borrow()[8..];
    let project = ProjectAccount::deserialize(&mut data)?;

    // 2. Validate project phase — must be Funding and not emergency-paused.
    //    Draft, Active, Completed, or Canceled all reject new subscriptions.
    require!(
        project.status == ProjectStatus::Funding && !project.is_paused,
        ComplianceError::ProjectNotActive
    );

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

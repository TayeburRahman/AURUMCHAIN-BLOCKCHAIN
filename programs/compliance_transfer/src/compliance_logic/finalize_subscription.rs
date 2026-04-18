use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;

#[derive(Accounts)]
pub struct FinalizeSubscription<'info> {
    #[account(
        mut,
        seeds = [b"subscription", subscription.investor.as_ref(), subscription.subscription_id.to_le_bytes().as_ref()],
        bump = subscription.bump,
        constraint = subscription.status == SubscriptionStatus::Pending @ ComplianceError::AlreadySettled,
    )]
    pub subscription: Account<'info, InvestmentSubscriptionAccount>,

    #[account(
        seeds = [b"compliance_control"],
        bump = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

pub fn handle_finalize_subscription(
    ctx:                    Context<FinalizeSubscription>,
    settlement_tx_hash:     [u8; 64],
    allocated_token_amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    let subscription = &mut ctx.accounts.subscription;

    subscription.status                 = SubscriptionStatus::Allocated;
    subscription.settlement_tx_hash     = settlement_tx_hash;
    subscription.allocated_token_amount = allocated_token_amount;
    subscription.settled_at             = clock.unix_timestamp;

    emit!(InvestmentSettled {
        subscription_id:   subscription.subscription_id,
        investor:          subscription.investor,
        project_id:        subscription.project_id,
        tx_hash:           settlement_tx_hash,
        timestamp:         clock.unix_timestamp,
    });

    emit!(TokensAllocated {
        subscription_id:   subscription.subscription_id,
        investor:          subscription.investor,
        amount:            allocated_token_amount,
        timestamp:         clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct InvestmentSettled {
    pub subscription_id:   u64,
    pub investor:          Pubkey,
    pub project_id:        u64,
    pub tx_hash:           [u8; 64],
    pub timestamp:         i64,
}

#[event]
pub struct TokensAllocated {
    pub subscription_id:   u64,
    pub investor:          Pubkey,
    pub amount:            u64,
    pub timestamp:         i64,
}

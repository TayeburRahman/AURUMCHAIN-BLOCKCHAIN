use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount};
use crate::state::*;
use crate::errors::DistributionError;

pub fn handle_execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
    let epoch                  = &mut ctx.accounts.epoch;
    let payout_record          = &mut ctx.accounts.payout_record;
    let investor_token_account = &ctx.accounts.investor_token_account;

    // 1. Calculate amount
    let balance = investor_token_account.amount;
    let amount  = balance
        .checked_mul(epoch.profit_per_token)
        .ok_or(DistributionError::Overflow)?;

    require!(amount > 0, DistributionError::InsufficientBalance);

    // 2. Perform Transfer from Treasury
    let cpi_accounts = Transfer {
        from:      ctx.accounts.treasury_vault.to_account_info(),
        to:        ctx.accounts.investor_payment_account.to_account_info(),
        authority: ctx.accounts.admin.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // 3. Record Payout
    payout_record.epoch       = epoch.key();
    payout_record.investor    = ctx.accounts.investor.key();
    payout_record.amount_paid = amount;
    payout_record.timestamp   = Clock::get()?.unix_timestamp;
    payout_record.bump        = ctx.bumps.payout_record;

    epoch.total_payouts_executed = epoch.total_payouts_executed
        .checked_add(1)
        .ok_or(DistributionError::Overflow)?;

    emit!(PayoutExecuted {
        project_id: epoch.project_id,
        epoch_id:   epoch.epoch_id,
        investor:   ctx.accounts.investor.key(),
        amount:     amount,
        timestamp:  payout_record.timestamp,
    });

    Ok(())
}

#[event]
pub struct PayoutExecuted {
    pub project_id: u64,
    pub epoch_id:   u64,
    pub investor:   Pubkey,
    pub amount:     u64,
    pub timestamp:  i64,
}

#[derive(Accounts)]
pub struct ExecutePayout<'info> {
    #[account(mut)]
    pub epoch: Account<'info, DistributionEpoch>,

    #[account(
        init,
        payer = payer,
        space = PayoutRecord::SIZE,
        seeds = [
            b"payout",
            epoch.key().as_ref(),
            investor.key().as_ref()
        ],
        bump
    )]
    pub payout_record: Account<'info, PayoutRecord>,

    pub project_account: Account<'info, ShadowProjectAccount>,

    #[account(
        constraint = investor_token_account.owner == investor.key(),
        constraint = investor_token_account.mint == project_account.mint @ DistributionError::InvalidTokenAccount
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub investor_payment_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_vault.owner == project_account.treasury_wallet @ DistributionError::InvalidTreasury
    )]
    pub treasury_vault: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"distribution_control"],
        bump = control.bump,
        has_one = admin @ DistributionError::Unauthorized
    )]
    pub control: Account<'info, DistributionControl>,

    pub admin: Signer<'info>,

    pub investor: SystemAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

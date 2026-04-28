use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount};
use crate::state::*;
use crate::errors::DistributionError;

pub fn handle_execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
    let epoch                  = &mut ctx.accounts.epoch;
    let payout_record          = &mut ctx.accounts.payout_record;
    let investor_token_account = &ctx.accounts.investor_token_account;

    // 0. Security Verification (Owner & Seeds)
    require_keys_eq!(ctx.accounts.project_account.owner.key(), ctx.accounts.project_registry_program.key(), DistributionError::Unauthorized);
    let (expected_pda, _bump) = Pubkey::find_program_address(
        &[b"project", epoch.project_id.to_le_bytes().as_ref()],
        &ctx.accounts.project_registry_program.key()
    );
    require_keys_eq!(ctx.accounts.project_account.key(), expected_pda, DistributionError::Unauthorized);

    // 0.1 Deserialization (Legacy padding bypass)
    let mut data: &[u8] = &ctx.accounts.project_account.data.borrow()[8..];
    let project = ShadowProjectAccount::deserialize(&mut data)?;

    // 0.2 Post-deserialization checks (Moved from macro constraints)
    require_keys_eq!(investor_token_account.mint, project.mint, DistributionError::InvalidTokenAccount);
    require_keys_eq!(ctx.accounts.treasury_vault.owner, project.treasury_wallet, DistributionError::InvalidTreasury);

    // 0.3 Status & Guard Check
    require!(
        project.status == ExternalProjectStatus::Active,
        DistributionError::Unauthorized
    );
    require!(!project.is_paused, DistributionError::Unauthorized);

    // 0.1 Timeline Guard: Parallel (0) vs Sequential (1)
    if project.distribution_mode == 1 { // Sequential
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= project.lockup_end_ts,
            DistributionError::Unauthorized // Payouts blocked until lockup ends
        );
    }

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

    /// CHECK: Manual owner and seed validation in handler
    pub project_account: UncheckedAccount<'info>,

    /// CHECK: Validated via seeds
    pub project_registry_program: UncheckedAccount<'info>,

    #[account(
        constraint = investor_token_account.owner == investor.key() @ DistributionError::InvalidTokenAccount
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub investor_payment_account: Account<'info, TokenAccount>,

    #[account(mut)]
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

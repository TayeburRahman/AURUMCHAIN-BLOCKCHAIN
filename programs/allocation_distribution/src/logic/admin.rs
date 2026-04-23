use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::DistributionError;

pub fn handle_initialize_config(
    ctx:   Context<InitializeConfig>, 
    admin: Pubkey
) -> Result<()> {
    let control = &mut ctx.accounts.control;
    control.admin = admin;
    control.is_paused = false;
    control.bump = ctx.bumps.control;
    Ok(())
}

pub fn handle_create_epoch(
    ctx:              Context<CreateEpoch>,
    project_id:       u64,
    profit_per_token: u64,
) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    let epoch   = &mut ctx.accounts.epoch;

    epoch.project_id             = project_id;
    epoch.epoch_id               = counter.count;
    epoch.profit_per_token       = profit_per_token;
    epoch.record_date            = Clock::get()?.unix_timestamp;
    epoch.total_payouts_executed = 0;
    epoch.is_completed           = false;
    epoch.bump                   = ctx.bumps.epoch;

    counter.count = counter.count.checked_add(1).ok_or(DistributionError::Overflow)?;

    emit!(EpochCreated {
        project_id:       project_id,
        epoch_id:         epoch.epoch_id,
        profit_per_token: profit_per_token,
        timestamp:        epoch.record_date,
    });

    Ok(())
}

#[event]
pub struct EpochCreated {
    pub project_id:       u64,
    pub epoch_id:         u64,
    pub profit_per_token: u64,
    pub timestamp:        i64,
}

#[derive(Accounts)]
#[instruction(admin_key: Pubkey)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = DistributionControl::SIZE,
        seeds = [b"distribution_control"],
        bump
    )]
    pub control: Account<'info, DistributionControl>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(project_id: u64)]
pub struct CreateEpoch<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = EpochCounter::SIZE,
        seeds = [b"counter", project_id.to_le_bytes().as_ref()],
        bump
    )]
    pub counter: Account<'info, EpochCounter>,

    #[account(
        init,
        payer = payer,
        space = DistributionEpoch::SIZE,
        seeds = [
            b"epoch",
            project_id.to_le_bytes().as_ref(),
            counter.count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub epoch: Account<'info, DistributionEpoch>,

    #[account(
        constraint = project_account.project_id == project_id @ DistributionError::Unauthorized
    )]
    pub project_account: Account<'info, ShadowProjectAccount>,

    #[account(
        seeds = [b"distribution_control"],
        bump = control.bump,
        has_one = admin @ DistributionError::Unauthorized
    )]
    pub control: Account<'info, DistributionControl>,

    pub admin: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

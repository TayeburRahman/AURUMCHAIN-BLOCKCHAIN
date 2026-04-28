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
    token_decimals:   u8,
) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    let epoch   = &mut ctx.accounts.epoch;

    // 0. Security Verification (Owner & Seeds)
    require_keys_eq!(ctx.accounts.project_account.owner.key(), ctx.accounts.project_registry_program.key(), DistributionError::Unauthorized);
    let (expected_pda, _bump) = Pubkey::find_program_address(
        &[b"project", project_id.to_le_bytes().as_ref()],
        &ctx.accounts.project_registry_program.key()
    );
    require_keys_eq!(ctx.accounts.project_account.key(), expected_pda, DistributionError::Unauthorized);


    epoch.project_id             = project_id;
    epoch.epoch_id               = counter.count;
    epoch.profit_per_token       = profit_per_token;
    epoch.record_date            = Clock::get()?.unix_timestamp;
    epoch.total_payouts_executed = 0;
    epoch.is_completed           = false;
    epoch.bump                   = ctx.bumps.epoch;
    epoch.token_decimals         = token_decimals;

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

    /// CHECK: Manual owner and seed validation in handler
    pub project_account: UncheckedAccount<'info>,

    /// CHECK: Validated via seeds
    pub project_registry_program: UncheckedAccount<'info>,

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

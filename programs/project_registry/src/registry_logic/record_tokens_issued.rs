use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct RecordTokensIssued<'info> {
    #[account(
        seeds = [b"control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump  = project.bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        constraint = (
            caller.key() == control.super_admin ||
            caller.key() == control.operational_admin
        ) @ RegistryError::Unauthorized
    )]
    pub caller: Signer<'info>,
}

pub fn handle_record_tokens_issued(
    ctx:    Context<RecordTokensIssued>,
    amount: u64,
) -> Result<()> {
    // SECURITY: Global Pause Check
    require!(!ctx.accounts.control.is_emergency_paused, RegistryError::Unauthorized);

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

#[event]
pub struct TokensIssued {
    pub project_id:    u64,
    pub amount_issued: u64,
    pub total_issued:  u64,
    pub supply_cap:    u64,
}

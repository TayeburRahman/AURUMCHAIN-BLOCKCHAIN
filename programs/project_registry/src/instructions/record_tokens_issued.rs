use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct RecordTokensIssued<'info> {
    #[account(
        seeds = [b"registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.to_le_bytes().as_ref()],
        bump  = project.bump,
    )]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        constraint = caller.key() == registry.authority @ RegistryError::UnauthorizedCpiCaller
    )]
    pub caller: Signer<'info>,
}

pub fn handler(
    ctx:    Context<RecordTokensIssued>,
    amount: u64,
) -> Result<()> {
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

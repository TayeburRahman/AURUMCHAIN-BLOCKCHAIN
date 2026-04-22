use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct SetProjectMint<'info> {
    #[account(
        seeds = [b"control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ControlAccount>,

    #[account(mut)]
    pub project: Account<'info, ProjectAccount>,

    #[account(
        constraint = (
            admin.key() == control.super_admin ||
            admin.key() == control.operational_admin
        ) @ RegistryError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn handle_set_project_mint(
    ctx:      Context<SetProjectMint>,
    mint_key: Pubkey,
) -> Result<()> {
    let project = &mut ctx.accounts.project;

    require!(
        project.mint == Pubkey::default(),
        RegistryError::MintAlreadySet
    );
    require!(mint_key != Pubkey::default(), RegistryError::InvalidMint);

    project.mint = mint_key;

    emit!(MintRegistered {
        project_id: project.project_id,
        mint:       mint_key,
    });

    Ok(())
}

#[event]
pub struct MintRegistered {
    pub project_id: u64,
    pub mint:       Pubkey,
}

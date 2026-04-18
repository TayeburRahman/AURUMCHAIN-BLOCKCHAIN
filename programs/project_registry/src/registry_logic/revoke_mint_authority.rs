use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct RevokeMintAuthority<'info> {
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
        constraint = super_admin.key() == control.super_admin @ RegistryError::Unauthorized
    )]
    pub super_admin: Signer<'info>,
}

pub fn handle_revoke_mint_authority(ctx: Context<RevokeMintAuthority>) -> Result<()> {
    let project = &mut ctx.accounts.project;

    require!(
        !project.mint_authority_revoked,
        RegistryError::MintAuthorityAlreadyRevoked
    );

    project.mint_authority_revoked = true;

    emit!(MintAuthorityRevoked {
        project_id: project.project_id,
        mint:       project.mint,
    });

    Ok(())
}

#[event]
pub struct MintAuthorityRevoked {
    pub project_id: u64,
    pub mint:       Pubkey,
}

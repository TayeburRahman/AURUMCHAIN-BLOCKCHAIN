use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"registry"],
        bump  = registry.bump,
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(
        constraint = super_admin.key() == registry.super_admin @ RegistryError::Unauthorized
    )]
    pub super_admin: Signer<'info>,

    #[account(
        constraint = authority.key() == registry.authority @ RegistryError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<TransferAuthority>,
    new_super_admin: Option<Pubkey>,
    new_authority:   Option<Pubkey>,
) -> Result<()> {
    let registry = &mut ctx.accounts.registry;

    if let Some(nsa) = new_super_admin {
        registry.super_admin = nsa;
    }
    if let Some(na) = new_authority {
        registry.authority = na;
    }

    emit!(AuthorityTransferred {
        new_super_admin: registry.super_admin,
        new_authority:   registry.authority,
    });

    Ok(())
}

#[event]
pub struct AuthorityTransferred {
    pub new_super_admin: Pubkey,
    pub new_authority:   Pubkey,
}

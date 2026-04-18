use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer  = payer,
        space  = RegistryConfig::SIZE,
        seeds  = [b"registry"],
        bump
    )]
    pub registry: Account<'info, RegistryConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeRegistry>,
    super_admin: Pubkey,
) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    registry.authority        = ctx.accounts.payer.key();
    registry.super_admin      = super_admin;
    registry.project_count    = 0;
    registry.bump             = ctx.bumps.registry;

    emit!(RegistryInitialized {
        authority:   registry.authority,
        super_admin: registry.super_admin,
    });

    Ok(())
}

#[event]
pub struct RegistryInitialized {
    pub authority:   Pubkey,
    pub super_admin: Pubkey,
}

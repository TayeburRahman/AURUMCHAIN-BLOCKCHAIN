use anchor_lang::prelude::*;
use crate::state::*;
use crate::RegistryError;

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ControlAccount>,

    /// Super Admin is required to sign for any authority changes
    #[account(
        signer,
        constraint = super_admin.key() == control.super_admin @ RegistryError::Unauthorized
    )]
    pub super_admin: Signer<'info>,

    /// The new candidate must also sign to acknowledge the role (Multi-Sig requirement)
    pub new_admin: Signer<'info>,
}

pub fn handle_transfer_authority(
    ctx: Context<TransferAuthority>,
    role_flag: u8, // 0: operational_admin, 1: upgrade_authority, 2: limits
    new_limits: Option<u64>,
) -> Result<()> {
    let control = &mut ctx.accounts.control;
    let new_admin_key = ctx.accounts.new_admin.key();

    match role_flag {
        0 => {
            control.operational_admin = new_admin_key;
        },
        1 => {
            control.upgrade_authority = new_admin_key;
        },
        2 => {
            if let Some(limits) = new_limits {
                control.operational_limits = limits;
            }
        },
        _ => return Err(error!(RegistryError::Unauthorized)), // Or a more specific error
    }

    emit!(AuthorityUpdated {
        role:      role_flag,
        new_value: new_admin_key,
    });

    Ok(())
}

#[event]
pub struct AuthorityUpdated {
    pub role:      u8,
    pub new_value: Pubkey,
}

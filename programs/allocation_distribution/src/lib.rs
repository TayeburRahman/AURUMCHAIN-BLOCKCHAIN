use anchor_lang::prelude::*;

mod errors;
mod logic;
mod state;

use crate::logic::*;

declare_id!("GG9mE55B6mMJFSY8RYVjCt62THVVrMjv55pVzHsZs8nT");

#[program]
pub mod allocation_distribution {
    use super::*;

    pub fn initialize_config(
        ctx:   Context<InitializeConfig>, 
        admin: Pubkey
    ) -> Result<()> {
        handle_initialize_config(ctx, admin)
    }

    pub fn create_epoch(
        ctx:              Context<CreateEpoch>,
        project_id:       u64,
        profit_per_token: u64,
    ) -> Result<()> {
        handle_create_epoch(ctx, project_id, profit_per_token)
    }

    pub fn execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
        handle_execute_payout(ctx)
    }
}

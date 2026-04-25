use anchor_lang::prelude::*;

mod errors;
mod logic;
mod state;

use crate::logic::*;

declare_id!("9RqVyvWA4ficqK351PoYh674mP1au4NmNzVM6LQcenjm");

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

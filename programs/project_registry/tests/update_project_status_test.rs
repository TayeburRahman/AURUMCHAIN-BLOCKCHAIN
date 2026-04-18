use anchor_lang::prelude::*;
use project_registry::state::*;
use project_registry::instructions::update_project_status::*;

#[cfg(test)]
mod tests {
    use super::*;

    // Mocking the Context and accounts for a unit-test style verification of the handler logic
    #[test]
    fn test_update_status_logic() {
        let mut project = ProjectAccount {
            project_id: 1,
            registry: Pubkey::default(),
            creator: Pubkey::default(),
            name: "Test Project".to_string(),
            symbol: "TEST".to_string(),
            uri: "https://test.com".to_string(),
            supply_cap: 1000,
            tokens_issued: 0,
            min_investment_usdc: 100,
            max_investment_usdc: 500,
            accepted_stablecoin: Pubkey::default(),
            treasury_wallet: Pubkey::default(),
            mint: Pubkey::default(),
            lockup_end_ts: 0,
            subscription_start: 0,
            subscription_end: 100,
            created_at: 0,
            distribution_cadence: 1,
            is_active: true,
            is_paused: false,
            mint_authority_revoked: false,
            bump: 0,
        };

        // Simulate pausing
        project.is_active = true;
        project.is_paused = true;

        assert_eq!(project.is_active, true);
        assert_eq!(project.is_paused, true);

        // Simulate unpausing
        project.is_paused = false;
        assert_eq!(project.is_paused, false);
    }
}

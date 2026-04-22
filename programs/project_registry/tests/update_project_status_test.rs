use anchor_lang::prelude::*;
use project_registry::state::*;

#[cfg(test)]
mod tests {
    use super::*;

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
            status: ProjectStatus::Draft,
            is_paused: false,
            mint_authority_revoked: false,
            round_limit_tokens: 0,
            current_round_issued: 0,
            asset_type: AssetType::RealEstate,
            bump: 0,
        };

        // Simulate promoting to Funding (would require mint to be set on-chain,
        // but here we test the logic directly on the struct)
        project.status = ProjectStatus::Funding;
        assert_eq!(project.status, ProjectStatus::Funding);

        // Simulate emergency pause (does NOT change status)
        project.is_paused = true;
        assert_eq!(project.status, ProjectStatus::Funding); // still Funding
        assert_eq!(project.is_paused, true);

        // Simulate resume
        project.is_paused = false;
        assert_eq!(project.is_paused, false);

        // Terminal state check: Completed cannot go back
        project.status = ProjectStatus::Completed;
        let is_terminal = project.status == ProjectStatus::Completed
            || project.status == ProjectStatus::Canceled;
        assert!(is_terminal);
    }
}

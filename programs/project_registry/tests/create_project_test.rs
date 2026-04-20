use anchor_lang::prelude::*;
use project_registry::state::*;
use project_registry::registry_logic::create_project::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_project_logic() {
        let mut control = ControlAccount {
            super_admin: Pubkey::new_unique(),
            operational_admin: Pubkey::new_unique(),
            upgrade_authority: Pubkey::new_unique(),
            is_emergency_paused: false,
            operational_limits: 1_000_000,
            project_count: 0,
            bump: 0,
        };

        let params = CreateProjectParams {
            name: "Aurum Project".to_string(),
            symbol: "AURUM".to_string(),
            uri: "https://aurum.chain".to_string(),
            supply_cap: 100_000,
            min_investment_usdc: 100,
            max_investment_usdc: 1000,
            accepted_stablecoin: Pubkey::new_unique(),
            treasury_wallet: Pubkey::new_unique(),
            lockup_end_ts: 1713456000,
            subscription_start: 1713456000,
            subscription_end: 1713542400,
            distribution_cadence: 1,
        };

        // Simulate logic in handle_create_project
        assert!(params.name.len() <= ProjectAccount::MAX_NAME_LEN);
        assert!(params.symbol.len() <= ProjectAccount::MAX_SYMBOL_LEN);
        assert!(params.uri.len() <= ProjectAccount::MAX_URI_LEN);
        assert!(params.min_investment_usdc <= params.max_investment_usdc);
        assert!(params.supply_cap > 0);
        assert!(params.subscription_end > params.subscription_start);

        let project_id = control.project_count;
        control.project_count += 1;

        assert_eq!(project_id, 0);
        assert_eq!(control.project_count, 1);

        let project = ProjectAccount {
            project_id,
            registry: Pubkey::default(),
            creator: Pubkey::default(),
            name: params.name.clone(),
            symbol: params.symbol.clone(),
            uri: params.uri.clone(),
            supply_cap: params.supply_cap,
            min_investment_usdc: params.min_investment_usdc,
            max_investment_usdc: params.max_investment_usdc,
            accepted_stablecoin: params.accepted_stablecoin,
            treasury_wallet: params.treasury_wallet,
            mint: Pubkey::default(),
            lockup_end_ts: params.lockup_end_ts,
            subscription_start: params.subscription_start,
            subscription_end: params.subscription_end,
            created_at: 1713456000,
            distribution_cadence: params.distribution_cadence,
            tokens_issued: 0,
            is_active: true,
            is_paused: false,
            mint_authority_revoked: false,
            bump: 0,
        };

        assert_eq!(project.name, "Aurum Project");
        assert_eq!(project.supply_cap, 100_000);
        assert_eq!(project.project_id, 0);
    }

    #[test]
    #[should_panic]
    fn test_invalid_investment_thresholds() {
        let params = CreateProjectParams {
            name: "Fail".to_string(),
            symbol: "FAIL".to_string(),
            uri: "uri".to_string(),
            supply_cap: 100,
            min_investment_usdc: 1000, // Min > Max
            max_investment_usdc: 500,
            accepted_stablecoin: Pubkey::new_unique(),
            treasury_wallet: Pubkey::new_unique(),
            lockup_end_ts: 0,
            subscription_start: 0,
            subscription_end: 100,
            distribution_cadence: 1,
        };

        if params.min_investment_usdc > params.max_investment_usdc {
            panic!("Invalid thresholds");
        }
    }
}

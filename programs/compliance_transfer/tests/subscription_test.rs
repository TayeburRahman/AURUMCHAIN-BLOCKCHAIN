#[cfg(test)]
mod tests {
    use compliance_transfer::state::*;

    #[test]
    fn test_subscription_status_flow() {
        let status = SubscriptionStatus::Pending;
        assert_eq!(status, SubscriptionStatus::Pending);

        let next_status = SubscriptionStatus::Settled;
        assert_ne!(status, next_status);
    }
}

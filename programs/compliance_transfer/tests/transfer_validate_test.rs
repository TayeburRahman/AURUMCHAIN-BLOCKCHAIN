#[cfg(test)]
mod tests {
    use compliance_transfer::state::*;

    #[test]
    fn test_transfer_decision_reason_codes() {
        let decision_ok = TransferDecision {
            allowed: true,
            reason_code: 0,
        };
        assert!(decision_ok.allowed);
        assert_eq!(decision_ok.reason_code, 0);

        let decision_fail = TransferDecision {
            allowed: false,
            reason_code: 0x01, // SenderNotVerified
        };
        assert!(!decision_fail.allowed);
        assert_eq!(decision_fail.reason_code, 1);
    }
}

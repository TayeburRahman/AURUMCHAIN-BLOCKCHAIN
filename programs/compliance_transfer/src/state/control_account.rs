use anchor_lang::prelude::*;

/// Global compliance control – singleton PDA seed: [b"compliance_control"]
#[account]
pub struct ComplianceControl {
    /// Operational admin (backend signer key)
    pub authority:        Pubkey,   // 32
    /// Super admin / client multisig
    pub super_admin:      Pubkey,   // 32
    /// When true, all wallets pass KYC checks – TESTING ONLY
    pub kyc_bypass:       bool,     //  1
    /// When true, all token transfers are blocked globally
    pub transfers_paused: bool,     //  1
    /// Program 1 ID – stored for reference and future CPI
    pub registry_program: Pubkey,   // 32
    pub bump:             u8,       //  1
    /// ── FUTURE EXPANSION PADDING ─────────────────────────────────────────────
    /// Add global flags (e.g., transfer_mode, marketplace_program_id) here.
    pub padding:          [u8; 64], 
}

impl ComplianceControl {
    // 8 (disc) + 32 + 32 + 1 + 1 + 32 + 1 + 64 (padding) = 171
    pub const SIZE: usize = 8 + 32 + 32 + 1 + 1 + 32 + 1 + 64;
}

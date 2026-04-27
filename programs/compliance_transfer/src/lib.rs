use anchor_lang::prelude::*;

mod state;
mod compliance_logic;

use crate::compliance_logic::*;
use crate::state::TransferDecision;

declare_id!("5u14TuRE7ozsKketfqF4R7XPvi7bof9RA455VcKME3Vy");

#[program]
pub mod compliance_transfer {
    use super::*;

    pub fn initialize_compliance(
        ctx:              Context<InitializeCompliance>,
        authority:        Pubkey,
        super_admin:      Pubkey,
        registry_program: Pubkey,
    ) -> Result<()> {
        handle_initialize_compliance(ctx, authority, super_admin, registry_program)
    }

    pub fn record_verified_wallet(
        ctx:    Context<RecordVerifiedWallet>,
        params: RecordWalletParams,
    ) -> Result<()> {
        handle_record_verified_wallet(ctx, params)
    }

    pub fn refresh_eligibility(
        ctx:    Context<RefreshVerifiedWallet>,
        params: RecordWalletParams,
    ) -> Result<()> {
        handle_refresh_eligibility(ctx, params)
    }

    pub fn revoke_wallet(ctx: Context<RevokeWallet>) -> Result<()> {
        handle_revoke_wallet(ctx)
    }

    pub fn set_kyc_bypass(ctx: Context<SuperAdminAction>, enabled: bool, nonce: u64) -> Result<()> {
        handle_set_kyc_bypass(ctx, enabled, nonce)
    }

    pub fn set_global_transfer_pause(
        ctx:    Context<AdminAction>,
        paused: bool,
        nonce:  u64,
    ) -> Result<()> {
        handle_set_global_transfer_pause(ctx, paused, nonce)
    }

    pub fn transfer_validate(
        ctx:                      Context<TransferValidate>,
        project_id:               u64,
        amount:                   u64,
        project_transfers_paused: bool,
        lockup_end_ts:            i64,
    ) -> Result<TransferDecision> {
        handle_transfer_validate(ctx, project_id, amount, project_transfers_paused, lockup_end_ts)
    }

    pub fn subscribe_investment(
        ctx:               Context<SubscribeInvestment>,
        subscription_id:   u64,
        project_id:        u64,
        investment_amount: u64,
        payment_asset:     Pubkey,
    ) -> Result<()> {
        handle_subscribe_investment(ctx, subscription_id, project_id, investment_amount, payment_asset)
    }

    pub fn finalize_subscription(
        ctx:                    Context<FinalizeSubscription>,
        settlement_tx_hash:     [u8; 64],
        allocated_token_amount: u64,
    ) -> Result<()> {
        handle_finalize_subscription(ctx, settlement_tx_hash, allocated_token_amount)
    }

    pub fn toggle_lockup_bypass(
        ctx:     Context<ToggleLockupBypass>,
        enabled: bool,
    ) -> Result<()> {
        handle_toggle_lockup_bypass(ctx, enabled)
    }
}

#[error_code]
pub enum ComplianceError {
    #[msg("Caller is not authorized to perform this action")]
    Unauthorized,

    #[msg("Token transfers are globally paused by compliance admin")]
    GlobalTransfersPaused,

    #[msg("Token transfers are paused for this project")]
    ProjectTransfersPaused,

    #[msg("Sender wallet is not KYC approved or transfer not allowed")]
    SenderNotApproved,

    #[msg("Receiver wallet is not KYC approved or transfer not allowed")]
    ReceiverNotApproved,

    #[msg("Sender KYC eligibility has expired – re-verification required")]
    SenderKycExpired,

    #[msg("Receiver KYC eligibility has expired – re-verification required")]
    ReceiverKycExpired,

    #[msg("Sender wallet is AML flagged or sanctioned")]
    SenderAmlBlocked,

    #[msg("Receiver wallet is AML flagged or sanctioned")]
    ReceiverAmlBlocked,

    #[msg("Token lock-up period is still active for this project")]
    LockupActive,

    #[msg("Expiry timestamp must be in the future")]
    InvalidExpiry,

    #[msg("Identity hash cannot be all zeros")]
    EmptyIdentityHash,

    #[msg("Investment amount is below project minimum")]
    InvestmentTooLow,

    #[msg("Investment amount exceeds project maximum")]
    InvestmentTooHigh,

    #[msg("Project is not active or is paused")]
    ProjectNotActive,

    #[msg("Subscription is already settled or allocated")]
    AlreadySettled,

    #[msg("Invalid subscription status for this operation")]
    InvalidStatus,

    #[msg("SPL mint CPI failed inside issue_tokens")]
    MintFailed,

    #[msg("Provided project_registry_program does not match on-chain control.registry_program")]
    InvalidRegistryProgram,

    #[msg("Investment subscription period is either not yet open or has already closed")]
    OutsideSubscriptionWindow,
}

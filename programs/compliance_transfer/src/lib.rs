use anchor_lang::prelude::*;

declare_id!("REPLACE_WITH_PLAYGROUND_PROGRAM_ID");

// =============================================================================
// AURUMCHAIN – Program 2: Compliance / Transfer Control
//
// Responsibilities:
//   - Store per-wallet KYC/AML eligibility on-chain
//   - Validate token transfers (KYC status + lock-up + pause flags)
//   - kyc_bypass mode for testing without real Sumsub integration
//   - Acts as CPI gate for Program 3 (token transfers call this first)
//
// Instructions:
//   1. initialize_compliance      – deploy once, set authorities + flags
//   2. record_verified_wallet     – admin marks wallet as KYC approved/rejected
//   3. revoke_wallet              – admin revokes wallet eligibility immediately
//   4. set_kyc_bypass             – toggle bypass for testing (super_admin only)
//   5. set_global_transfer_pause  – pause/resume all transfers globally
//   6. transfer_validate          – gate called by Program 3 before any transfer
//
// KYC Integration Note:
//   Backend dev calls record_verified_wallet after Sumsub webhook fires.
//   The program stores the result — it does NOT call Sumsub directly.
//   kyc_bypass = true lets you test Programs 2 & 3 without real KYC.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────────────────────
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
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMERATIONS
// ─────────────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum KycStatus {
    Pending,   // 0 – not yet reviewed
    Approved,  // 1 – KYC passed
    Rejected,  // 2 – KYC failed
    Expired,   // 3 – needs re-verification
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AmlStatus {
    Clear,   // 0 – no flags
    Flagged, // 1 – under review
    Blocked, // 2 – sanctioned / blocked
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

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
}

impl ComplianceControl {
    // 8 (disc) + 32 + 32 + 1 + 1 + 32 + 1 + 64 (padding) = 171
    pub const SIZE: usize = 8 + 32 + 32 + 1 + 1 + 32 + 1 + 64;
}

/// Per-wallet eligibility – PDA seeds: [b"eligibility", wallet_pubkey]
/// Created by record_verified_wallet; read by transfer_validate.
#[account]
pub struct InvestorEligibilityAccount {
    /// The Solana wallet this record belongs to
    pub wallet:             Pubkey,     // 32
    /// KYC approval state
    pub kyc_status:         KycStatus,  //  1
    /// AML / sanctions state
    pub aml_status:         AmlStatus,  //  1
    /// SHA-256 of off-chain applicant_id (Sumsub) – audit reference
    pub identity_hash:      [u8; 32],   // 32
    /// Whether this wallet may subscribe to investments
    pub investment_allowed: bool,       //  1
    /// Whether this wallet may send or receive project tokens
    pub transfer_allowed:   bool,       //  1
    /// Unix timestamp when eligibility expires (0 = never)
    pub expiry_timestamp:   i64,        //  8
    /// Which admin key recorded this entry
    pub recorded_by:        Pubkey,     // 32
    pub bump:               u8,         //  1
}

impl InvestorEligibilityAccount {
    // 8 (disc) + 32 + 1 + 1 + 32 + 1 + 1 + 8 + 32 + 1 + 32 (padding) = 149
    pub const SIZE: usize = 8 + 32 + 1 + 1 + 32 + 1 + 1 + 8 + 32 + 1 + 32;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETER STRUCTS
// ─────────────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RecordWalletParams {
    pub kyc_status:         KycStatus,
    pub aml_status:         AmlStatus,
    /// SHA-256 of off-chain identity record (Sumsub applicant_id)
    pub identity_hash:      [u8; 32],
    pub investment_allowed: bool,
    pub transfer_allowed:   bool,
    /// Unix timestamp when eligibility expires (0 = never expires)
    pub expiry_timestamp:   i64,
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS  (Section 3.5 – on-chain audit trail)
// ─────────────────────────────────────────────────────────────────────────────

#[event]
pub struct WalletVerified {
    pub wallet:             Pubkey,
    pub kyc_status:         u8,  // 0=Pending 1=Approved 2=Rejected 3=Expired
    pub aml_status:         u8,  // 0=Clear   1=Flagged  2=Blocked
    pub investment_allowed: bool,
    pub transfer_allowed:   bool,
    pub expiry_timestamp:   i64,
    pub timestamp:          i64,
}

#[event]
pub struct WalletRevoked {
    pub wallet:     Pubkey,
    pub revoked_by: Pubkey,
    pub timestamp:  i64,
}

#[event]
pub struct TransferValidated {
    pub sender:      Pubkey,
    pub receiver:    Pubkey,
    pub project_id:  u64,
    pub allowed:     bool,
    pub bypass_used: bool,
    pub timestamp:   i64,
}

#[event]
pub struct GlobalPauseChanged {
    pub transfers_paused: bool,
    pub changed_by:       Pubkey,
    pub timestamp:        i64,
}

#[event]
pub struct KycBypassChanged {
    pub bypass_enabled: bool,
    pub changed_by:     Pubkey,
    pub timestamp:      i64,
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT CONTEXTS
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeCompliance<'info> {
    #[account(
        init,
        payer  = payer,
        space  = ComplianceControl::SIZE,
        seeds  = [b"compliance_control"],
        bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordVerifiedWallet<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = InvestorEligibilityAccount::SIZE,
        seeds = [b"eligibility", wallet.key().as_ref()],
        bump,
    )]
    pub eligibility: Account<'info, InvestorEligibilityAccount>,

    /// CHECK: Target wallet address being registered – not required to sign
    pub wallet: UncheckedAccount<'info>,

    #[account(
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        mut,
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeWallet<'info> {
    #[account(
        mut,
        seeds = [b"eligibility", eligibility.wallet.as_ref()],
        bump  = eligibility.bump,
    )]
    pub eligibility: Account<'info, InvestorEligibilityAccount>,

    #[account(
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

/// Super-admin only actions (kyc_bypass toggle)
#[derive(Accounts)]
pub struct SuperAdminAction<'info> {
    #[account(
        mut,
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        constraint = super_admin.key() == control.super_admin
            @ ComplianceError::Unauthorized
    )]
    pub super_admin: Signer<'info>,
}

/// Admin or super-admin actions (pause toggle)
#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    #[account(
        constraint = (
            authority.key() == control.authority ||
            authority.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

/// Transfer gate – called by Program 3 or backend before any token movement
#[derive(Accounts)]
pub struct TransferValidate<'info> {
    #[account(
        seeds = [b"compliance_control"],
        bump  = control.bump,
    )]
    pub control: Account<'info, ComplianceControl>,

    /// Sender's eligibility PDA
    #[account(
        seeds = [b"eligibility", sender_eligibility.wallet.as_ref()],
        bump  = sender_eligibility.bump,
    )]
    pub sender_eligibility: Account<'info, InvestorEligibilityAccount>,

    /// Receiver's eligibility PDA
    #[account(
        seeds = [b"eligibility", receiver_eligibility.wallet.as_ref()],
        bump  = receiver_eligibility.bump,
    )]
    pub receiver_eligibility: Account<'info, InvestorEligibilityAccount>,

    /// CHECK: Backend signer or Program 3 CPI signer – verified by authority constraint
    #[account(
        constraint = (
            caller.key() == control.authority ||
            caller.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub caller: Signer<'info>,
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM MODULE
// ─────────────────────────────────────────────────────────────────────────────

#[program]
pub mod compliance_transfer {
    use super::*;

    // ── 1. initialize_compliance ─────────────────────────────────────────────
    // Called ONCE at deployment by the deployer.
    // Sets authority, super_admin, registry_program reference, and default flags.
    pub fn initialize_compliance(
        ctx:              Context<InitializeCompliance>,
        authority:        Pubkey,
        super_admin:      Pubkey,
        registry_program: Pubkey,
    ) -> Result<()> {
        let control = &mut ctx.accounts.control;
        control.authority        = authority;
        control.super_admin      = super_admin;
        control.kyc_bypass       = false; // MUST be false in production
        control.transfers_paused = false;
        control.registry_program = registry_program;
        control.bump             = ctx.bumps.control;
        Ok(())
    }

    // ── 2. record_verified_wallet ────────────────────────────────────────────
    // Admin (backend signer) calls this after Sumsub webhook fires.
    // Creates the eligibility PDA on first call; updates it on re-verification.
    // Emits: WalletVerified
    pub fn record_verified_wallet(
        ctx:    Context<RecordVerifiedWallet>,
        params: RecordWalletParams,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // Expiry must be in the future if set
        if params.expiry_timestamp > 0 {
            require!(
                params.expiry_timestamp > clock.unix_timestamp,
                ComplianceError::InvalidExpiry
            );
        }

        // Identity hash must not be empty
        require!(
            params.identity_hash != [0u8; 32],
            ComplianceError::EmptyIdentityHash
        );

        let eligibility = &mut ctx.accounts.eligibility;
        eligibility.wallet             = ctx.accounts.wallet.key();
        eligibility.kyc_status         = params.kyc_status.clone();
        eligibility.aml_status         = params.aml_status.clone();
        eligibility.identity_hash      = params.identity_hash;
        eligibility.investment_allowed = params.investment_allowed;
        eligibility.transfer_allowed   = params.transfer_allowed;
        eligibility.expiry_timestamp   = params.expiry_timestamp;
        eligibility.recorded_by        = ctx.accounts.authority.key();
        eligibility.bump               = ctx.bumps.eligibility;

        let kyc_byte: u8 = match &params.kyc_status {
            KycStatus::Pending  => 0,
            KycStatus::Approved => 1,
            KycStatus::Rejected => 2,
            KycStatus::Expired  => 3,
        };
        let aml_byte: u8 = match &params.aml_status {
            AmlStatus::Clear   => 0,
            AmlStatus::Flagged => 1,
            AmlStatus::Blocked => 2,
        };

        emit!(WalletVerified {
            wallet:             ctx.accounts.wallet.key(),
            kyc_status:         kyc_byte,
            aml_status:         aml_byte,
            investment_allowed: params.investment_allowed,
            transfer_allowed:   params.transfer_allowed,
            expiry_timestamp:   params.expiry_timestamp,
            timestamp:          clock.unix_timestamp,
        });

        Ok(())
    }

    // ── 3. revoke_wallet ─────────────────────────────────────────────────────
    // Immediately revokes a wallet (sanctions hit, KYC failure, fraud detection).
    // Sets all flags to denied and marks KYC as Rejected, AML as Blocked.
    // Emits: WalletRevoked
    pub fn revoke_wallet(ctx: Context<RevokeWallet>) -> Result<()> {
        let clock = Clock::get()?;
        let eligibility = &mut ctx.accounts.eligibility;

        eligibility.kyc_status         = KycStatus::Rejected;
        eligibility.aml_status         = AmlStatus::Blocked;
        eligibility.investment_allowed = false;
        eligibility.transfer_allowed   = false;

        emit!(WalletRevoked {
            wallet:     eligibility.wallet,
            revoked_by: ctx.accounts.authority.key(),
            timestamp:  clock.unix_timestamp,
        });

        Ok(())
    }

    // ── 4. set_kyc_bypass ────────────────────────────────────────────────────
    // Super-admin only. Enables/disables KYC bypass mode.
    // When enabled: all KYC/AML wallet checks are skipped.
    // USE ONLY ON DEVNET/TESTNET — never enable on Mainnet.
    // Emits: KycBypassChanged
    pub fn set_kyc_bypass(ctx: Context<SuperAdminAction>, enabled: bool) -> Result<()> {
        let clock = Clock::get()?;
        ctx.accounts.control.kyc_bypass = enabled;

        emit!(KycBypassChanged {
            bypass_enabled: enabled,
            changed_by:     ctx.accounts.super_admin.key(),
            timestamp:      clock.unix_timestamp,
        });

        Ok(())
    }

    // ── 5. set_global_transfer_pause ─────────────────────────────────────────
    // Admin or super-admin pauses/resumes all token transfers globally.
    // Maps to /admin/controls/pause-transfers in the API spec.
    // Emits: GlobalPauseChanged
    pub fn set_global_transfer_pause(
        ctx:    Context<AdminAction>,
        paused: bool,
    ) -> Result<()> {
        let clock = Clock::get()?;
        ctx.accounts.control.transfers_paused = paused;

        emit!(GlobalPauseChanged {
            transfers_paused: paused,
            changed_by:       ctx.accounts.authority.key(),
            timestamp:        clock.unix_timestamp,
        });

        Ok(())
    }

    // ── 6. transfer_validate ─────────────────────────────────────────────────
    // Gate instruction called before any project token transfer.
    // Program 3 will CPI into this. Backend can also call directly.
    //
    // project_transfers_paused: read from Program 1's ProjectAccount by caller
    // lockup_end_ts:            read from Program 1's ProjectAccount by caller
    //
    // Returns Ok(()) → transfer ALLOWED
    // Returns Err(_) → transfer BLOCKED (with reason code)
    // Emits: TransferValidated
    pub fn transfer_validate(
        ctx:                      Context<TransferValidate>,
        project_id:               u64,
        project_transfers_paused: bool,  // from Program 1 ProjectAccount
        lockup_end_ts:            i64,   // from Program 1 ProjectAccount
    ) -> Result<()> {
        let clock   = Clock::get()?;
        let control = &ctx.accounts.control;
        let sender  = &ctx.accounts.sender_eligibility;
        let receiver = &ctx.accounts.receiver_eligibility;
        let bypass  = control.kyc_bypass;

        // ── Guard 1: Global compliance pause ─────────────────────────────────
        require!(!control.transfers_paused, ComplianceError::GlobalTransfersPaused);

        // ── Guard 2: Project-level pause (from Program 1) ─────────────────────
        require!(!project_transfers_paused, ComplianceError::ProjectTransfersPaused);

        // ── Guard 3: Lock-up period ───────────────────────────────────────────
        if lockup_end_ts > 0 {
            require!(
                clock.unix_timestamp >= lockup_end_ts,
                ComplianceError::LockupActive
            );
        }

        // ── Guards 4–9: Wallet KYC/AML (skipped when kyc_bypass = true) ──────
        if !bypass {
            // Sender KYC
            require!(
                sender.kyc_status == KycStatus::Approved,
                ComplianceError::SenderNotApproved
            );
            // Sender AML
            require!(
                sender.aml_status == AmlStatus::Clear,
                ComplianceError::SenderAmlBlocked
            );
            // Sender expiry
            if sender.expiry_timestamp > 0 {
                require!(
                    clock.unix_timestamp < sender.expiry_timestamp,
                    ComplianceError::SenderKycExpired
                );
            }
            // Sender transfer_allowed flag
            require!(sender.transfer_allowed, ComplianceError::SenderNotApproved);

            // Receiver KYC
            require!(
                receiver.kyc_status == KycStatus::Approved,
                ComplianceError::ReceiverNotApproved
            );
            // Receiver AML
            require!(
                receiver.aml_status == AmlStatus::Clear,
                ComplianceError::ReceiverAmlBlocked
            );
            // Receiver expiry
            if receiver.expiry_timestamp > 0 {
                require!(
                    clock.unix_timestamp < receiver.expiry_timestamp,
                    ComplianceError::ReceiverKycExpired
                );
            }
            // Receiver transfer_allowed flag
            require!(receiver.transfer_allowed, ComplianceError::ReceiverNotApproved);
        }

        emit!(TransferValidated {
            sender:      sender.wallet,
            receiver:    receiver.wallet,
            project_id,
            allowed:     true,
            bypass_used: bypass,
            timestamp:   clock.unix_timestamp,
        });

        Ok(())
    }
}

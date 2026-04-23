use anchor_lang::prelude::*;
use crate::state::*;
use crate::ComplianceError;

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

    /// CHECK: Backend signer
    #[account(
        constraint = (
            caller.key() == control.authority ||
            caller.key() == control.super_admin
        ) @ ComplianceError::Unauthorized
    )]
    pub caller: Signer<'info>,
}

pub fn handle_transfer_validate(
    ctx:                      Context<TransferValidate>,
    _project_id:               u64,
    amount:                   u64, // ADDED: Required by AC-BC-202-1
    project_transfers_paused: bool,
    lockup_end_ts:            i64,
) -> Result<TransferDecision> {
    let clock   = Clock::get()?;
    let control = &ctx.accounts.control;
    let sender  = &ctx.accounts.sender_eligibility;
    let receiver = &ctx.accounts.receiver_eligibility;
    let bypass  = control.kyc_bypass;

    let mut decision = TransferDecision {
        allowed:     true,
        reason_code: 0,
    };

    // 1. Emergency Pause check (0x05)
    if control.transfers_paused {
        decision.allowed = false;
        decision.reason_code = 0x05;
    }

    // 2. Project Pause check (0x05)
    if project_transfers_paused && decision.allowed {
        decision.allowed = false;
        decision.reason_code = 0x05;
    }

    // 3. Lock-up period check (0x03)
    if lockup_end_ts > 0 && clock.unix_timestamp < lockup_end_ts && decision.allowed {
        if !sender.lockup_bypass {
            decision.allowed = false;
            decision.reason_code = 0x03;
        }
    }

    // 4. Compliance Logic (Only if not bypassed)
    if !bypass && decision.allowed {
        // --- SENDER CHECKS ---
        if sender.aml_status == AmlStatus::Blocked {
            decision.allowed = false;
            decision.reason_code = 0x06; // Sanctioned
        } else if sender.kyc_status != KycStatus::Approved || !sender.transfer_allowed {
            decision.allowed = false;
            decision.reason_code = 0x01; // SenderNotVerified
        } else if sender.expiry_timestamp > 0 && clock.unix_timestamp >= sender.expiry_timestamp {
            decision.allowed = false;
            decision.reason_code = 0x04; // KycExpired
        }

        // --- RECEIVER CHECKS ---
        if decision.allowed {
            if receiver.aml_status == AmlStatus::Blocked {
                decision.allowed = false;
                decision.reason_code = 0x06; // Sanctioned
            } else if receiver.kyc_status != KycStatus::Approved || !receiver.transfer_allowed {
                decision.allowed = false;
                decision.reason_code = 0x02; // ReceiverNotVerified
            } else if receiver.expiry_timestamp > 0 && clock.unix_timestamp >= receiver.expiry_timestamp {
                decision.allowed = false;
                decision.reason_code = 0x04; // KycExpired
            }
        }
    }

    emit!(TransferValidated {
        sender:      sender.wallet,
        receiver:    receiver.wallet,
        project_id:  _project_id,
        amount,
        allowed:     decision.allowed,
        bypass_used: bypass,
        reason_code: decision.reason_code,
        timestamp:   clock.unix_timestamp,
    });

    Ok(decision)
}

#[event]
pub struct TransferValidated {
    pub sender:      Pubkey,
    pub receiver:    Pubkey,
    pub project_id:  u64,
    pub amount:      u64,
    pub allowed:     bool,
    pub bypass_used: bool,
    pub reason_code: u8,
    pub timestamp:   i64,
}

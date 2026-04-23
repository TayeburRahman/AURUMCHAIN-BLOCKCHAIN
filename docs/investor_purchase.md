# Investor Purchase & Distribution Lifecycle

This document outlines the end-to-end technical process of an investor purchasing tokens and receiving profit distributions within the Aurumchain platform.

## 1. The Purchase Flow (Funding Round)

The purchase process is split into three phases to ensure regulatory compliance and secure settlement.

### Phase A: KYC & Eligibility
**Handler**: `record_verified_wallet` / `refresh_eligibility`
**File**: `programs/compliance_transfer/src/logic/record_verified_wallet.rs`
*   **Actor**: Admin / Compliance Service.
*   **Process**: The investor's wallet is white-listed. A `VerifiedWallet` PDA is created to store KYC/AML status.
*   **Result**: The investor is now "Eligible" to interact with project subscriptions.

### Phase B: Subscription (The "Buy" Action)
**Handler**: `subscribe_investment`
**File**: `programs/compliance_transfer/src/logic/subscribe_investment.rs`
*   **Actor**: Investor.
*   **Process**: 
    1.  Investor sends USDC to the Project's Treasury.
    2.  A `SubscriptionAccount` PDA is created to record the investment amount.
*   **Result**: Funds are secured in the project treasury, but tokens are not yet delivered.

### Phase C: Finalization (Token Delivery)
**Handler**: `finalize_subscription`
**File**: `programs/compliance_transfer/src/logic/finalize_subscription.rs`
*   **Actor**: Admin (Backend Service).
*   **Process**: 
    1.  Admin verifies the subscription.
    2.  Calls `finalize_subscription` which triggers a CPI (Cross-Program Invocation) to the **Project Registry**.
    3.  The **Project Registry** (`issue_tokens`) mints the project tokens directly to the investor's wallet.
*   **Result**: Investor officially holds the tokens.

---

## 2. The Distribution Flow (Profit Sharing)

Once the project is active and generating revenue, the distribution program takes over.

### Phase D: Epoch Creation (Manual Declaration)
**Handler**: `create_epoch`
**File**: `programs/allocation_distribution/src/logic/admin.rs`
*   **Actor**: Admin.
*   **Process**: Admin defines a `profit_per_token` rate for a project (e.g., $0.05 USDC per token).
*   **Result**: A `DistributionEpoch` PDA is created on-chain.

### Phase E: Payout Execution (The "Claim" Action)
**Handler**: `execute_payout`
**File**: `programs/allocation_distribution/src/logic/payout.rs`
*   **Actor**: Investor (or Admin on their behalf).
*   **Process**: 
    1.  The program calculates: `Investor_Balance * Epoch_Rate`.
    2.  USDC is transferred from the **Project Treasury** to the **Investor Wallet**.
    3.  A `PayoutRecord` PDA is created to prevent double-claims.
*   **Result**: Investor receives their share of the profits.

---

## Technical File Ownership Summary

| Component | Responsibility | Program | Primary Files |
| :--- | :--- | :--- | :--- |
| **KYC/AML** | White-listing wallets | `compliance_transfer` | `record_verified_wallet.rs` |
| **Funding** | Collecting USDC | `compliance_transfer` | `subscribe_investment.rs` |
| **Minting** | Generating tokens | `project_registry` | `registry_logic/mod.rs` |
| **Security** | Checking eligibility | `compliance_transfer` | `transfer_validate.rs` |
| **Payouts** | Distributing profit | `allocation_distribution` | `payout.rs`, `admin.rs` |
| **Metadata** | Project source of truth | `project_registry` | `project_account.rs` |

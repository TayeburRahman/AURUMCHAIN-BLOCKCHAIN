# Investor Lifecycle & Lock-up Hardening Plan

This document outlines the technical implementation for hardening the project lifecycle and investor liquidity controls, as aligned with David's vision for "Investor Trust" and "Controlled Flexibility."

## 1. Vision Objectives

To provide a 100% transparent and auditable environment for investors, the system must enforce three core pillars:
- **Immutable Duration**: The total lifecycle of the investment must be hard-coded on-chain.
- **One-Way Liquidity Protection**: Lock-up dates can be extended for project safety but never reduced to benefit "insiders."
- **Controlled Compassion**: Admins must have the ability to grant individual "Emergency Exits" without compromising the global lock-up.

---

## 2. Feature Descriptions

### A. On-Chain Duration (`duration_months`)
Currently, the "Duration" of a project is stored primarily in the database. This creates a trust gap.
- **Implementation**: Add `duration_months` (u8) to the `ProjectAccount` struct.
- **Purpose**: Acts as the "Source of Truth" for the upcoming Investment Program to calculate payout schedules and project completion dates.

### B. The "Extension-Only" Guard (Project Level)
A programmatic constraint that prevents the shortening of a lock-up period.
- **Implementation**: A `require!` check in the `update_project_params` instruction.
- **Logic**: `New Lock-up Timestamp >= Existing Lock-up Timestamp`.
- **Purpose**: Guarantees investors that their "Liquidity Shield" cannot be arbitrarily removed by an admin after they have committed funds.

### C. The "Per-Investor Bypass" (User Level)
An individualized "Emergency Key" for the lock-up period.
- **Implementation**: A `lockup_bypass` boolean field in the `InvestorEligibilityAccount`.
- **Logic**: The `transfer_validate` function will ignore the global project lock-up if this flag is `true` for a specific wallet.
- **Purpose**: Allows the Superadmin to handle exceptional cases (e.g., hardship/medical emergencies) where an investor needs to liquidate their stake early, without opening the gates for the entire project.

---

## 3. Implementation Roadmap

### Phase 1: Smart Contract Upgrades (Programs)
1.  **Registry Program**:
    - Update `ProjectAccount` struct (using existing padding).
    - Update `create_project` and `update_project_params` logic.
2.  **Compliance Program**:
    - Update `InvestorEligibilityAccount` struct.
    - Update `transfer_validate` to check for the bypass flag.
    - Add `toggle_lockup_bypass` instruction for Superadmins.

### Phase 2: Web3 Service Layer
1.  Update `ProjectRegistryService` to handle the new `duration_months` field.
2.  Update `ComplianceService` to expose the `toggleLockupBypass` method.

### Phase 3: Admin Dashboard Integration
1.  **Project Edit Form**: Add validation logic to prevent reducing dates.
2.  **Investor Management**: Add a "Lock-up Bypass" toggle to the investor details drawer.
3.  **Legacy Sync**: Implement a one-time "Sync to Chain" for the existing 10 projects to backfill their Duration on-chain.

---

## 4. Security & Audit Trail
All changes (extensions or bypasses) are recorded on the Solana blockchain.
- **Extensions**: Visible via `ProjectUpdated` events.
- **Bypasses**: Visible via `EligibilityUpdated` events.
- **Transparency**: Investors can verify their own bypass status and the project's global lock-up status via any Solana block explorer.

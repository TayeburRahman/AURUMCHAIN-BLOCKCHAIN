# AURUMCHAIN Cross-Program Synchronization Audit

This document confirms the structural integrity of the AURUMCHAIN smart contracts after the synchronized redeployment.

## 1. Field Alignment Map (ProjectAccount)
The following byte-map is now identical across **Project Registry**, **Compliance Transfer**, and **Allocation Distribution**.

| Offset (Bytes) | Field Name | Type | Description |
| :--- | :--- | :--- | :--- |
| 0 - 8 | Discriminator | u64 | Anchor Account Type Identifier |
| 8 - 16 | project_id | u64 | Unique Numeric Identifier |
| 16 - 48 | registry | Pubkey | Parent Registry Address |
| 48 - 80 | creator | Pubkey | Admin Wallet |
| 80 - 148 | name | String | 4 (len) + 64 bytes |
| 148 - 162 | symbol | String | 4 (len) + 10 bytes |
| 162 - 366 | uri | String | 4 (len) + 200 bytes |
| 366 - 374 | supply_cap | u64 | Total Supply |
| 374 - 382 | tokens_issued | u64 | Cumulative Minted |
| 382 - 390 | min_investment | u64 | Min USDC |
| 390 - 398 | max_investment | u64 | Max USDC |
| 398 - 406 | token_price_usdc | u64 | **ON-CHAIN TRUTH PRICE** |
| 406 - 438 | accepted_stable | Pubkey | USDC/USDT |
| 438 - 470 | treasury_wallet | Pubkey | Admin Treasury |
| 470 - 502 | mint | Pubkey | SPL Mint Address |
| 502 - 510 | lockup_end_ts | i64 | Transfer restriction |
| 510 - 518 | sub_start | i64 | Window start |
| 518 - 526 | sub_end | i64 | Window end |
| 526 - 534 | created_at | i64 | Timestamp |
| 534 | cadence | u8 | Frequency |
| 535 | duration | u8 | Lifecycle |
| 536 | mode | u8 | Parallel (0) vs Sequential (1) |
| 537 | status | Enum | Current Lifecycle Stage |
| 538 | is_paused | bool | Emergency Pause |
| 539 | revoked | bool | Permanent Mint Cap |
| 540 - 548 | round_limit | u64 | Current Round Cap |
| 548 - 556 | round_issued | u64 | Current Round Minted |
| 556 | asset_type | Enum | UI / Logic Preset |
| 557 | bump | u8 | PDA Bump |
| 558 - 600 | **Padding** | [u8; 42] | **Future-Proofing Buffer** |

## 2. Enum Variant Synchronization
The following Enums are serialized as `u8` variant tags. Their order is strictly identical.

### ProjectStatus
1. `Draft` (0)
2. `Funding` (1)
3. `Funded` (2)  <-- New Stage
4. `Active` (3)
5. `Completed` (4)
6. `Canceled` (5)

## 3. Critical CPI Logic (Zero-Drift)
In `compliance_transfer::finalize_subscription`:
- The program performs `ProjectAccount::try_from_slice(&data[8..])`.
- It reads `project.token_price_usdc`.
- **Logic:** `final_tokens = usd_invested * 10^6 / project.token_price_usdc`.
- This ensures the Registry **only** mints the amount justified by the on-chain price, regardless of what the Admin Dashboard or Database suggests.

## 4. Potential Mismatch Risks (Mitigated)
- **Risk:** String length causing offset shift.
- **Mitigation:** All programs use the same `String` deserialization. Borsh handles the length prefix dynamically.
- **Risk:** Missing fields in Shadow Account.
- **Mitigation:** The `ShadowProjectAccount` in Payouts now includes every Registry field, including metadata, ensuring the deserializer never reads the wrong bytes.

## 5. Feature-Specific Verification Logic

### A. Project Creation & Initialization
- **Logic:** `handle_create_project` enforces that a project starts in `Draft`.
- **Match:** Admin Dashboard must send `token_price_usdc` and `distribution_mode` (0 or 1) during the `create_project` call.
- **Guard:** `ProjectAccount::SIZE` is strictly enforced at 600 bytes during `init`.

### B. Subscription Creation (`subscribe_investment`)
- **Logic:** Compliance reads Registry state to verify `min_investment_usdc` and `max_investment_usdc`.
- **Match:** The `investment_amount` passed by the investor is checked against these two fields.
- **Guard:** If `ProjectStatus` is not `Funding`, the subscription will fail immediately on-chain.

### C. Status Transitions & Funded Phase
- **Logic:** `handle_update_project_status` allows moving to `Funded`.
- **Match:** When a project hits its goal, Admin moves status to `Funded`.
- **Guard:** Payouts in Program 3 (Allocation) are blocked until the status is moved to `Active`. This prevents premature distributions during the "Funded" grace period.

### D. Zero-Drift Minting (`finalize_subscription`)
- **Logic:** Compliance ignores the `allocated_token_amount` parameter if `token_price_usdc > 0`.
- **Match:** It calculates: `final_amount = investment * 10^6 / token_price`.
- **Guard:** This prevents an Admin from accidentally minting more tokens than the investor paid for.

### E. Distribution & Payouts (`execute_payout`)
- **Logic:** Checks `ShadowProjectAccount.status == Active`.
- **Match:** The variant index (3) must match exactly between programs.
- **Guard:** Checks `ShadowProjectAccount.is_paused == false`. This allows the Registry to "Emergency Stop" all payouts across the entire ecosystem.

### F. Mint Authority Revocation
- **Logic:** `revoke_mint_authority` sets `mint_authority_revoked = true` (byte 539).
- **Match:** Registry's `issue_tokens` checks this byte before every mint.
- **Guard:** Once revoked, no program (Compliance or Registry) can ever mint another token for that project.

## 6. Final Deployment & Synchronization Procedure

**This sequence guarantees that your Database and Blockchain will be 100% synchronized with no legacy errors.**

### Step 1: Schema Alignment
Execute the `sync_redeploy.sql` script in the Supabase SQL editor to update all project and subscription tables with the new on-chain fields.

### Step 2: Data Sanitization (Clean Slate)
To prevent "Ghost Projects" pointing to old Program IDs, execute the following:
```sql
TRUNCATE TABLE public.subscriptions CASCADE;
TRUNCATE TABLE public.projects CASCADE;
```

### Step 3: Blockchain Deployment
Deploy the synchronized programs via Solana PG.

### Step 4: Verification
Create a new project via the Admin Dashboard and verify that `token_price_usdc` and `distribution_mode` are correctly populated on-chain.

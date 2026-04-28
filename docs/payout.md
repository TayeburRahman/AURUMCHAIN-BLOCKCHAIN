# Aurumchain: Payout & Distribution Workflow

This document details the end-to-end architecture and workflow of the Profit Distribution system, bridging the Solana Smart Contracts (`allocation_distribution` program), the Supabase Database, and the Next.js Frontend.

---

## 1. Core Architecture Principles

The distribution system is built on a **"Blockchain as State, Supabase as Read-Replica"** architecture. 

* **Smart Contract (Solana):** Handles the exact mathematical entitlement calculations, enforces lock-up rules (Parallel vs. Sequential), executes the secure USDC treasury transfers, and writes immutable `PayoutRecord` PDAs to prevent double-claiming.
* **Database (Supabase):** Mirrors the blockchain state in the `payout_cycles` and `payout_records` tables. This allows the frontend to instantly render historical dashboards and lifetime earnings without making slow, expensive RPC calls to scan the entire blockchain.

---

## 2. Admin Workflow: Creating an Epoch

An **Epoch** is a single payout event (e.g., "Q1 2026 Dividend"). 

### Step-by-Step Execution:
1. **Initiation (UI):** The Admin navigates to `/admin/distributions`. They select an active project and input the `profit_per_token` in USDC.
2. **Blockchain Transaction:** The Admin's wallet signs the `createEpoch` instruction. 
   * The program reads the `EpochCounter` PDA to determine the current epoch number.
   * It initializes a new `DistributionEpoch` PDA storing the `profit_per_token`.
3. **Database Sync:** Immediately after the transaction reaches `confirmed` status, the frontend hits the `/api/indexer/sync-epoch` webhook.
4. **Supabase Record:** The webhook inserts a new row into the `payout_cycles` table. It includes a `UNIQUE(project_id, epoch_id)` constraint. If the indexer attempts to insert the same epoch twice (e.g., due to a network retry), the database rejects the duplicate, ensuring **idempotency**.

---

## 3. The Payout Execution Mechanics (Smart Contract)

When an investor's payout is triggered (`handle_execute_payout` inside `programs/allocation_distribution/src/logic/payout.rs`), the smart contract enforces strict rules before moving any money.

### Rule 1: The Lock-up Guardrail
The contract checks the project's `distribution_mode`:
* **Mode 0 (Parallel):** Payouts are executed immediately, even if the investor's tokens are locked and untradeable (e.g., yield-generating Mining hardware).
* **Mode 1 (Sequential):** The contract compares the current blockchain `Clock` against the project's `lockup_end_ts`. If the lock-up has not expired, the transaction strictly aborts with an `Unauthorized` error (e.g., Real Estate still under construction).

### Rule 2: The Entitlement Calculation
The contract reads the investor's current token balance natively from the SPL Token Program. 
`Payout Amount = (Investor Token Balance) × (profit_per_token)`

*Because the system reads the live SPL Token balance at the exact moment of execution, it automatically supports secondary market trading. Whoever holds the token at the time of execution receives the payout.*

### Rule 3: The Treasury Transfer
The contract executes a Cross-Program Invocation (CPI) to transfer USDC directly from the Project's Multi-Sig Treasury Vault to the verified Investor's Payment Wallet.

### Rule 4: The Immutable Receipt
A `PayoutRecord` PDA is initialized on-chain using the seeds `[b"payout", epoch_key, investor_key]`. If someone tries to execute the payout again for the same investor on the same epoch, Solana will reject the transaction because the PDA already exists.

---

## 4. Investor Workflow: Viewing Earnings

1. **Dashboard Loading:** The investor logs into `/dashboard/distributions`.
2. **Fast Querying:** The page fetches data directly from Supabase. It uses a SQL trigger (`update_portfolio_earnings`) to instantly display the **"Total Lifetime Earnings"** without calculating it on the fly.
3. **Receipt Verification:** The table displays their historical payouts. Each row contains the `tx_hash` from the Solana transaction, allowing the investor to click through to Solscan and independently verify that the funds arrived via the smart contract, maintaining full trustless transparency.

---

## 5. Handling the "Final Payout" (Principal Return)

The smart contract is agnostic to whether a payout is a "cadence profit" or a "final principal return." 

If a project reaches the end of its 24-month duration and the client wishes to return the original investment plus a final profit, the Admin simply creates one final Epoch where the `profit_per_token` is set to the combined total (e.g., $1.00 principal + $0.10 profit = $1.10). Following this final epoch, the Admin updates the `ProjectStatus` to `Completed`, freezing the token from further trading or distributions.

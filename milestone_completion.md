# Milestone 2: Completion & Verification Walkthrough

This guide provides a step-by-step walkthrough to verify the completion of **Milestone 2** using the Aurumchain Frontend. This process validates the integration between the Solana Smart Contracts, Supabase Indexer, and the Admin/Investor Dashboards.

---

## 🏗️ 1. Project Creation (Admin)
**Goal:** Initialize a new real estate or mining project on the blockchain.

1.  **Navigate to Admin Dashboard:**
    *   URL: `http://localhost:3000/admin/investments`
2.  **Create New Project:**
    *   Click **"Create New Project"**.
    *   Fill in details (Name, Symbol, Supply Cap).
    *   **Crucial:** Ensure the **Mint Address** matches your Mock USDC from `.env` (`AJujcxZi...`).
3.  **Verify On-Chain:**
    *   Once submitted, verify the project appears in the "Funding" state.
    *   Note the **Project ID** (e.g., Project 06).

---

## 👤 2. Investor Onboarding & Whitelisting
**Goal:** Register a wallet as an eligible investor.

1.  **Access Investor Dashboard:**
    *   URL: `http://localhost:3000/dashboard`
2.  **Connect Wallet:**
    *   Connect the wallet holding your Mock USDC (e.g., `8G4TDS7p...`).
3.  **Compliance Check:**
    *   The system will automatically detect if the wallet is whitelisted.
    *   If not, follow the on-screen prompts to "Apply for KYC" (This triggers the `recordVerifiedWallet` on-chain action).

---

## 💸 3. Investment Flow (Investor)
**Goal:** Invest USDC into the project.

1.  **Browse Opportunities:**
    *   Find your project (Project 06) in the "Available Projects" list.
2.  **Subscribe to Investment:**
    *   Enter an amount (e.g., 1,000 USDC).
    *   Click **"Invest Now"**.
3.  **Approval:**
    *   Approve the USDC transfer in your Phantom/Solflare wallet.
    *   **Result:** You will see a "Pending Allocation" status in your Portfolio.

---

## ⚙️ 4. Settlement & Allocation (Admin)
**Goal:** Finalize the investment and mint project tokens to the investor.

1.  **Navigate to Admin Investments:**
    *   URL: `http://localhost:3000/admin/investments`
2.  **Verify & Issue:**
    *   Locate the pending subscription in the **"Pending"** tab.
    *   Click **"Verify & Issue"**.
    *   **Behind the Scenes:** This triggers the `finalizeSubscription` contract call, which creates the investor's token account and mints the tokens.

---

## 📊 5. Profit Distribution (Admin)
**Goal:** Distribute dividends to all token holders.

1.  **Navigate to Distributions:**
    *   URL: `http://localhost:3000/admin/distributions`
2.  **Create Payout Epoch:**
    *   Select your project (Project 06).
    *   Enter a **Profit Per Token** (e.g., `0.50` USDC).
    *   Click **"Execute Epoch On-Chain"**.
3.  **Batch Payout:**
    *   Once the Epoch is created, click **"Execute Payout"** next to the new epoch.
    *   Select all eligible investors (including your test wallet).
    *   Click **"Confirm & Execute Batch"**.
    *   **Result:** The script will transfer USDC from the Treasury back to the investor wallets.

---

## 🏁 6. Final Verification
**Goal:** Confirm the cycle is complete.

1.  **Check Investor Earnings:**
    *   Go to `http://localhost:3000/dashboard/transactions`.
    *   Verify the "Payout" appears in the transaction history.
2.  **Check Blockchain:**
    *   View the transaction on Solscan.
    *   Confirm the **Total Lifetime Earnings** has updated on the Investor Dashboard.

---

### ✅ Milestone 2 Success Criteria
- [x] **Token Minting:** Tokens were minted during Stage 4.
- [x] **Security:** Only whitelisted wallets could invest in Stage 3.
- [x] **Financial Logic:** Profits were calculated and distributed correctly in Stage 5.
- [x] **Operational:** The Admin Dashboard successfully triggered all contract-linked actions.

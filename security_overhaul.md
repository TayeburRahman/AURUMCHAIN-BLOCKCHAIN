# AURUMCHAIN Security Overhaul: Master Blueprint

This document outlines a deep security hardening of the Aurumchain platform. These changes focus on shifting trust from the client to the server and implementing protocol-level safeguards against common Web3 and REST API attacks.

---

## 1. Investment Engine: Forge-Proofing
Currently, the investment creation API trusts client-provided token counts and lacks transaction verification.

### [Phase A] Server-Side Recalculation
- **Target**: `app/api/investments/create/route.ts`
- **Action**: Fetch the project's `token_price` and `token_decimals` directly from Supabase.
- **Math**: Calculate `tokensPurchased = investmentAmount / tokenPrice` on the server.
- **Security**: The `tokensPurchased` field in the request body will be strictly ignored to prevent value-spoofing attacks.

### [Phase B] On-Chain Signature Verification
- **Action**: Require `blockchainSignature` in every investment request.
- **Protocol**: Call `connection.getSignatureStatus(sig)` to ensure the transaction:
  1. Exists on Solana Devnet/Mainnet.
  2. Is "confirmed" or "finalized".
  3. [Optional] Verify the transaction logs involve the correct project Registry PDA.

---

## 2. Admin API: Permission & Integrity Lockdown
Administrative counters must be immutable through REST to prevent manual database corruption.

### Whitelist Field Enforcement
- **Target**: `app/api/admin/projects/[id]/route.ts`
- **Logic**: Remove the following fields from the `fieldsToUpdate` array:
  - `tokens_issued`
  - `current_round_issued`
  - `available_tokens`
- **Reason**: These fields are "Derived State" from the blockchain. They should only be updated by the automated `refreshProject` sync logic, never manually via a `PUT` request.

---

## 3. Wallet Security: Anti-Replay Guard
Prevent attackers from intercepting and reusing (replaying) valid wallet signatures.

### Nonce-Tracking Handshake
- **Target**: `lib/domains/wallet/service.ts`
- **Flow**:
  1. Frontend requests a unique, one-time `nonce` from the server.
  2. Server stores this nonce mapped to the user session.
  3. Frontend signs a message containing this nonce.
  4. Server verifies the signature AND checks that the nonce matches the stored value, then immediately invalidates the nonce.

---

## 4. Rate Limiting & Admin Whitelisting
Protect the platform from automated Denial of Service (DoS) and Brute Force attacks.

### [NEW] Next.js Middleware Limiter
- **Target**: `middleware.ts`
- **Implementation**:
  - Track requests via `x-forwarded-for` or IP address.
  - **Auth Limits**: 5 signup/login attempts per 10 minutes.
  - **Investment Limits**: 3 creation attempts per 5 minutes per user.
- **Admin IP Whitelist**: 
  - Define an array of `ADMIN_ALLOWED_IPS` in `.env`.
  - If a request's IP is in the whitelist, bypass all rate-limiting logic.

---

## 5. Input Sanitization: Zod Guardian Layer
Ensure every piece of data entering the system is strictly typed and sanitized.

### Strict Schemas
- **Target**: `lib/utils/validation.ts`
- **Rules**:
  - `amount`: Must be `Number`, minimum `1`.
  - `projectId`: Must be a valid UUID or Integer.
  - `blockchainSignature`: Must be a valid Base58 string of exactly 64 bytes.

---

## Verification Plan (Tomorrow's Audit)

### Automated Test Suite
- `npm run test:security`: A dedicated script to attempt "Buying 1M tokens for $1" and verifying rejection.
- `npm run test:replay`: Attempting to use the same signature twice to verify the nonce invalidation.

---

> [!IMPORTANT]
> **Sumsub Status**: Per client request, Sumsub signature verification is **excluded** from this overhaul and remains a "TODO" for future compliance hardening.

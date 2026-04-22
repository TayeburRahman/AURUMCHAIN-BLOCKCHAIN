## Feature: Registry Stabilization & Recovery Phase

**Timestamp:** 2026-04-22T15:35:00+06:00
**Github Commit Message:** Metadata Resilience, Legacy Project Recovery & UX Polish

This phase focused on recovering "lost" metadata for legacy projects (100–108) and hardening the Admin Dashboard to prevent state mismatches and UI errors.

### 1. Database & Persistence Layer

| File | Line Numbers | Feature Added | Reason for Addition |
| :--- | :--- | :--- | :--- |
| **[011_add_project_metadata...sql](file:///c:/Rupom/Projects/AURUMCHAIN/supabase/migrations/011_add_project_metadata_columns.sql)** | **1–13 (NEW)** | Metadata Fallback Schema | Adds `token_symbol`, `metadata_uri`, and `lockup_end_date` to Supabase to provide a data fallback when on-chain fetches fail. |
| **[route.ts (POST)](file:///c:/Rupom/Projects/AURUMCHAIN/app/api/admin/projects/route.ts)** | **66–70** | Metadata Persistence | Ensures new projects save their token symbol and URI to the database during creation for redundant storage. |
| **[[id]/route.ts (PUT)](file:///c:/Rupom/Projects/AURUMCHAIN/app/api/admin/projects/[id]/route.ts)** | **59-63** | Metadata Updates | Allows manual overriding and synchronization of fallback metadata for existing projects. |

### 2. Recovery & Migration Scripts

| File | Line Numbers | Feature Added | Reason for Addition |
| :--- | :--- | :--- | :--- |
| **[import-orphans.ts](file:///c:/Rupom/Projects/AURUMCHAIN/scripts/import-orphans.ts)** | **1–100 (NEW)** | On-Chain Orphan Import | Scans Solana for legacy IDs (100-108) and reconstitutes their missing database records from raw blockchain memory. |
| **[backfill-metadata.ts](file:///c:/Rupom/Projects/AURUMCHAIN/scripts/backfill-metadata.ts)** | **1–107 (NEW)** | Schema-Proof Reader | Uses dynamic offset calculation to extract strings from the legacy 612-byte account format without crashing. |

### 3. Dashboard Hardening & UX Polish

| File | Line Numbers | Feature Added | Reason for Addition |
| :--- | :--- | :--- | :--- |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **15–42** | Resilient Interface Types | Added fallback metadata fields to the `EnrichedProject` type to resolve TypeScript "Property Missing" errors. |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **53, 659** | Auto-Scroll Anchor | Added `useRef` and `formRef` to allow the page to navigate dynamically to the project form. |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **371–388** | UX Trigger & Scroll | Implemented automatic smooth-scrolling to the form when the "Edit" or "Add" buttons are clicked. |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **371–380** | HTML5 Date Formatting | Replaced `.split('T')[0]` with `.slice(0, 16)` to fix the `datetime-local` input format mismatch error. |

---

## Feature: Project Registry Stabilization & Dashboard Hardening

**Timestamp:** 2026-04-22T15:00:00+06:00
**Github Commit Message:** Locked Project Recovery & Frontend Serialization Hardening

Implemented a "Self-Healing" architecture to unlock legacy projects (100–105) and resolved critical frontend serialization errors. Replaced stored-bump validation with dynamic PDA derivation and implemented smart fallbacks for missing project metadata.

### 1. Smart Contract: Self-Healing Registry (Rust)

| File                                                                                                                                       | Line Numbers | Feature Added     | Reason for Addition                                                                                                                                          |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[update_project_params.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_params.rs)** | **22–33**    | Dynamic PDA Bumps | Removed frozen stored-bump validation (Error 102). Allows the program to interact with legacy projects that were initialized with non-canonical bumps.       |
| **[Logic Files (9x)](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/)**                                 | **Varies**   | Dynamic Unlocking | Applied the dynamic bump fix to `issue_tokens`, `reset_round`, `update_status`, and all other registry logic files to ensure full project lifecycle support. |

### 2. Frontend: Serialization & Data Persistence

| File                                                                                                       | Line Numbers | Feature Added               | Reason for Addition                                                                                                                                       |
| :--------------------------------------------------------------------------------------------------------- | :----------- | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **198–216**  | Strict `null` Serialization | Resolved `RangeError: indeterminate span` by explicitly passing `null` for optional fields to the Anchor client, ensuring correct memory calculation.     |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **263-280**  | Smart Metadata Fallback     | Implemented a database-to-blockchain fallback. Ensures Token Symbol, Metadata URL, and Lock-up Date are displayed even if on-chain enrichment is pending. |

### 3. Diagnostic & Recovery Tooling

| File                                                                                  | Line Numbers | Feature Added        | Reason for Addition                                                                                                        |
| :------------------------------------------------------------------------------------ | :----------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **[scan-registry.ts](file:///c:/Rupom/Projects/AURUMCHAIN/scripts/scan-registry.ts)** | **50–85**    | Schema-Proof Reading | Added raw byte-size detection (612 vs 816 bytes) and hex dumping to diagnose account layout mismatches in legacy projects. |

### 4. Admin Recovery & UX Polish

| File                                                                                                       | Line Numbers | Feature Added            | Reason for Addition                                                                                     |
| :--------------------------------------------------------------------------------------------------------- | :----------- | :----------------------- | :------------------------------------------------------------------------------------------------------ |
| **[import-orphans.ts](file:///c:/Rupom/Projects/AURUMCHAIN/scripts/import-orphans.ts)**                    | **1-100**    | On-Chain Orphan Import   | Restored Projects 100-108 from Solana into Supabase, recovering "lost" legacy data.                     |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **640, 385** | Auto-Scroll to Form      | Improved UX by automatically scrolling the page to the Edit/Add form when triggered.                    |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **371-380**  | HTML5 Date Compatibility | Fixed console formatting errors by ensuring ISO dates are correctly sliced for `datetime-local` inputs. |

---

## Feature: Phased Token Launch — Phase 3 (On-Chain Verified Authority & Robust Init)

**Timestamp:** 2026-04-22T12:08:26+06:00
**Github Commit Message:** Verified Token Authorities & Idempotent Birth - Choice A Implementation

Implemented the "Sovereign Authority" model. Every new project now atomically initializes a program-owned account to act as its Mint Authority. This ensures that on block explorers like Solscan, the Mint Authority is explicitly labeled as owned by the Aurumchain program. Also introduced `init_if_needed` to make the project creation flow resilient against partial on-chain failures.

### Step 3.1 — Verified Authority State & Registry Wiring

| File                                                                                                                | Line Numbers   | Feature Added                 | Reason for Addition                                                                                                                         |
| :------------------------------------------------------------------------------------------------------------------ | :------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **[mint_authority.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/mint_authority.rs)** | **1–10 (NEW)** | `MintAuthorityAccount` struct | Defines the on-chain data account for the authority. Its presence allows Solscan to resolve the "AURUMCHAIN" Program ID as the legal owner. |
| **[mod.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/mod.rs)**                       | **4, 7**       | Module Export                 | Registers the new authority state with the program registry.                                                                                |

### Step 3.2 — Atomic Verified Birth & Robustness

| File                                                                                                                             | Line Numbers     | Feature Added                            | Reason for Addition                                                                                                                                        |
| :------------------------------------------------------------------------------------------------------------------------------- | :--------------- | :--------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[create_project.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/create_project.rs)**     | **36-43, 52-60** | `init_if_needed` for Project & Authority | Prevents "AccountAlreadyInitialized" (Error 3005) failures. If a transaction fails halfway, the next attempt self-heals by re-using the existing accounts. |
| **[issue_tokens.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/issue_tokens.rs)**         | **33-40**        | `UncheckedAccount` Hybrid Bridge         | Ensures `issue_tokens` is backward compatible. It handles both "Virtual" signers (Legacy Projects #1-102) and "Verified" signers (Project #103+).          |
| **[set_project_mint.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/set_project_mint.rs)** | **13-17**        | Circular Seed Fix                        | Resolves a technical deadlock where the project account was trying to verify its own address before it was even loaded.                                    |

### Step 3.3 — Frontend Synchronisation

| File                                                                                                                        | Line Numbers | Feature Added              | Reason for Addition                                                                                           |
| :-------------------------------------------------------------------------------------------------------------------------- | :----------- | :------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **[projectRegistryRepository.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/repositories/projectRegistryRepository.ts)** | **69-74**    | `mintAuthorityPda` Mapping | Updates the instruction builder to pass the new required authority account to the blockchain during creation. |

---

## Feature: Phased Token Launch - Phase 2 (Compliance Integration & IDL Sync)

**Timestamp:** 2026-04-22T09:35:54+06:00
**Github Commit Message:** Compliance Integration & IDL Sync - according to phased_token_plan.md- changes.md - 546b1e2672a29270dd0f93754286d2e92a679cc3

Synchronized the `compliance_transfer` program with the new registry lifecycle and established a robust infrastructure for IDL auditability.

### File: `programs/compliance_transfer/src/compliance_logic/subscribe_investment.rs`

| Line Numbers | Feature Added            | Reason for Addition                                                                                                                                  |
| :----------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **80-85**    | Phased Status Validation | Replaced the stale `is_active` check with a strict `ProjectStatus::Funding` requirement to ensure investments only happen during the correct window. |

### File: `programs/compliance_transfer/src/compliance_logic/finalize_subscription.rs`

| Line Numbers | Feature Added                | Reason for Addition                                                                                                                                                                 |
| :----------- | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1-178**    | Direct-to-Wallet Minting CPI | Refactored to perform a Cross-Program Invocation (CPI) into `project_registry::issue_tokens`. Tokens are now minted and delivered to investors automatically upon admin settlement. |
| **87-99**    | Dynamic Discriminator        | Implemented runtime sha256 computation for the `issue_tokens` instruction discriminator, removing the fragility of hard-coded magic bytes.                                          |

### File: `package.json`

| Line Numbers | Feature Added         | Reason for Addition                                                                                                                          |
| :----------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **15-17**    | IDL Patching Pipeline | Added `patch-idl` and `sync-idl` scripts to automate the flow of patching manual types into generated IDLs and syncing them to the frontend. |

### File: `scripts/patch-idl.ts` & `scripts/idl-patch/compliance_transfer.patch.json`

| Line Numbers | Feature Added      | Reason for Addition                                                                                                                                                                   |
| :----------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **All New**  | IDL Infrastructure | Created a dedicated pipeline to maintain types that Anchor macros don't auto-generate (like foreign mirror structs), ensuring "Solscan Explorer" decoder rings remain fully detailed. |

---

## Feature: Phased Token Launch — Phase 1 (Registry Program Refactor)

**Github Commit Message:** Registry Program Refactor - according to phased_token_plan.md- changes.md - be1c79ffe6159126ddc43ef7048339ea00a75fa6

**Timestamp:** 2026-04-22T09:10:53+06:00
Implemented the foundational on-chain phase enforcement system for the Project Registry program. Replaced the binary `is_active: bool` flag with a formal `ProjectStatus` enum, introduced `AssetType` classification, added round-based token tracking fields, and implemented the complete SPL CPI minting pipeline — enabling the Registry program itself to act as a controlled, PDA-gated Mint Authority.

---

### Step 1.1 — `project_account.rs` (State Refactor)

| File                                                                                                                  | Line Numbers | Feature Added                                                                | Reason for Addition                                                                                                                                                                                                                                 |
| :-------------------------------------------------------------------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)** | **3–21**     | `ProjectStatus` enum (`Draft`, `Funding`, `Active`, `Completed`, `Canceled`) | Replaces the removed `is_active: bool`. Provides a formal, typed lifecycle that prevents operational clashes (e.g. minting on a Canceled project).                                                                                                  |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)** | **29–34**    | `AssetType` enum (`RealEstate`, `Mining`, `Other`)                           | Drives Dashboard UI presets and determines the default `round_limit_tokens` behaviour per asset class.                                                                                                                                              |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)** | **60**       | `status: ProjectStatus` field                                                | Replaces `is_active: bool` in the `ProjectAccount` struct. New projects start as `Draft`; admin must promote to `Funding` explicitly.                                                                                                               |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)** | **67**       | `round_limit_tokens: u64` field                                              | Max tokens mintable in the current round. `0` = uncapped within `supply_cap`. Used by `issue_tokens` to enforce phased release.                                                                                                                     |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)** | **69**       | `current_round_issued: u64` field                                            | Running counter for tokens issued in the current round. Reset by admin via `reset_round`. Enables multi-phase Mining-style releases.                                                                                                                |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)** | **71**       | `asset_type: AssetType` field                                                | Classification of the underlying asset. Controls UI presets and future logic branching in the Dashboard and service layer.                                                                                                                          |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)** | **110–137**  | `SIZE` constant recalculated with full comment breakdown                     | Ensures the `#[account(space=...)]` allocation is byte-perfect after removing `is_active` (1 byte) and adding `status` (1), `round_limit_tokens` (8), `current_round_issued` (8), `asset_type` (1) = net +18 bytes, plus 64-byte alignment padding. |

---

### Step 1.2 — `create_project.rs` (Params & Initialisation)

| File                                                                                                                         | Line Numbers | Feature Added                                                                      | Reason for Addition                                                                                                                                |
| :--------------------------------------------------------------------------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[create_project.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/create_project.rs)** | **19–23**    | `asset_type: AssetType` + `round_limit_tokens: u64` added to `CreateProjectParams` | Admin must specify the asset class and initial round cap at creation time. These drive downstream minting logic.                                   |
| **[create_project.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/create_project.rs)** | **127**      | `project.status = ProjectStatus::Draft`                                            | Replaced `project.is_active = true`. New projects are inert until an admin explicitly promotes them to `Funding`, preventing premature investment. |
| **[create_project.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/create_project.rs)** | **132–134**  | Initialise `asset_type`, `round_limit_tokens`, `current_round_issued = 0`          | Prevents uninitialised memory in the new fields and establishes a clean starting state for the round tracker.                                      |

---

### Step 1.3 — `update_project_status.rs` + `lib.rs` (Status Transition)

| File                                                                                                                                       | Line Numbers  | Feature Added                                                             | Reason for Addition                                                                                                                                           |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :------------ | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[update_project_status.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_status.rs)** | **29–33**     | Signature changed: `is_active: bool` → `new_status: ProjectStatus`        | Enables direct typed status transitions instead of a binary toggle. Supports all 5 lifecycle states.                                                          |
| **[update_project_status.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_status.rs)** | **40–44**     | Terminal-state guard (`InvalidStatusTransition`)                          | Prevents resurrection from `Completed` or `Canceled` — once a project reaches a terminal state, it is irreversible on-chain.                                  |
| **[update_project_status.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_status.rs)** | **46–52**     | Mint-required guard (`MintNotSet`)                                        | Prevents promoting a project to `Funding` before a mint address has been set via `set_project_mint`. Ensures the token exists before investors can subscribe. |
| **[update_project_status.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_status.rs)** | **60, 71–78** | `ProjectStateChanged` event with `old_status` / `new_status`              | Renamed from `PauseStateChanged`. Richer audit trail for the Dashboard and off-chain indexers to track lifecycle transitions.                                 |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/lib.rs)**                                                    | **7**         | `use crate::state::*;`                                                    | Required so `ProjectStatus` resolves in the instruction signature at the program entrypoint level.                                                            |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/lib.rs)**                                                    | **49–55**     | `update_project_status` signature updated to `new_status: ProjectStatus`  | Matches the refactored handler signature.                                                                                                                     |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/lib.rs)**                                                    | **113–118**   | `InvalidStatusTransition`, `MintNotSet`, `RoundLimitExceeded` error codes | New typed error variants needed by the phase-enforcement guards in Steps 1.3, 1.4, and 1.5.                                                                   |

---

### Step 1.4 — `update_project_params.rs` (Post-Creation Updates)

| File                                                                                                                                       | Line Numbers | Feature Added                                                                                | Reason for Addition                                                                                                       |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **[update_project_params.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_params.rs)** | **17–20**    | `round_limit_tokens: Option<u64>` added to `ProjectUpdateParams`                             | Allows admin to adjust the per-round cap after project creation (e.g., setting a higher cap at the start of a new round). |
| **[update_project_params.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_params.rs)** | **21–22**    | `asset_type: Option<AssetType>` added to `ProjectUpdateParams`                               | Allows super_admin to correct the asset class if it was set incorrectly at creation.                                      |
| **[update_project_params.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/update_project_params.rs)** | **62–68**    | Handler blocks for both new optional fields, with `SupplyCapExceeded` guard on `round_limit` | Prevents setting a round limit that exceeds the lifetime supply cap, which would be an invalid configuration.             |

---

### Step 1.5 — `issue_tokens.rs` (**NEW FILE** — Direct-to-Wallet Minting)

| File                                                                                                                     | Line Numbers | Feature Added                                                                                     | Reason for Addition                                                                                                                                                                                                   |
| :----------------------------------------------------------------------------------------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[issue_tokens.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/issue_tokens.rs)** | **1–13**     | `anchor_spl::token` imports (`Mint`, `MintTo`, `Token`, `TokenAccount`)                           | Required for the SPL Token CPI call that performs the actual on-chain minting.                                                                                                                                        |
| **[issue_tokens.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/issue_tokens.rs)** | **15–54**    | `IssueTokens` accounts struct with `mint_authority_pda` (seeds: `["mint_authority", project_id]`) | Defines the PDA that acts as the program-controlled Mint Authority. Anchor validates seeds at runtime, ensuring only the Registry program can sign minting CPIs.                                                      |
| **[issue_tokens.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/issue_tokens.rs)** | **62–75**    | 4 security guards: emergency pause, `mint_authority_revoked`, `status == Funding`, `is_paused`    | Prevents minting outside the Funding phase, after the Master Key has been destroyed, or during an emergency pause — all enforced atomically on-chain.                                                                 |
| **[issue_tokens.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/issue_tokens.rs)** | **77–90**    | Supply cap check + round limit check (checks-effects pattern)                                     | `tokens_issued` and `current_round_issued` are updated **before** the CPI to follow Solana's checks-effects-interactions pattern, preventing reentrancy-style exploits.                                               |
| **[issue_tokens.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/issue_tokens.rs)** | **92–108**   | `token::mint_to(CpiContext::new_with_signer(...))`                                                | The core CPI. Signs with `["mint_authority", project_id, bump]` PDA seeds so the SPL Token Program accepts the Registry PDA as the authority. Tokens land directly in the investor's wallet — no intermediate escrow. |
| **[issue_tokens.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/issue_tokens.rs)** | **110–118**  | `TokensMinted` event with `recipient`, `amount`, `total_issued`, `round_issued`                   | Provides a full audit trail for every minting event. Frontend/indexers can reconstruct the complete issuance history from these events.                                                                               |

---

### Step 1.6 — `revoke_mint_authority.rs` (Real SPL Authority Destruction)

| File                                                                                                                                       | Line Numbers | Feature Added                                                                                            | Reason for Addition                                                                                                                                                                                                      |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[revoke_mint_authority.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/revoke_mint_authority.rs)** | **1–2**      | `anchor_spl::token::{self, Mint, SetAuthority, Token}` + `spl_token::instruction::AuthorityType` imports | Required for the `set_authority` CPI that permanently destroys the on-chain mint authority.                                                                                                                              |
| **[revoke_mint_authority.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/revoke_mint_authority.rs)** | **28–36**    | `mint` + `mint_authority_pda` + `token_program` accounts added                                           | The CPI requires the actual SPL mint account and the PDA that currently holds authority so the Token Program can verify and remove it.                                                                                   |
| **[revoke_mint_authority.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/revoke_mint_authority.rs)** | **55–74**    | `token::set_authority(..., AuthorityType::MintTokens, None)` CPI                                         | Sets mint authority to `None` permanently. Investors can verify this on Solscan — the Token Program shows "Mint Authority: None", providing cryptographic proof of supply immutability.                                  |
| **[revoke_mint_authority.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/revoke_mint_authority.rs)** | **77–79**    | Auto-transition `Funding → Active` on revocation                                                         | When the Master Key is destroyed, the project is no longer in the funding phase. Automatically moving to `Active` keeps the lifecycle state consistent without requiring a separate `update_project_status` transaction. |

---

### Step 1.7 — `reset_round.rs` (**NEW FILE** — Round Management)

| File                                                                                                                   | Line Numbers | Feature Added                                                                                               | Reason for Addition                                                                                                                                                                                                       |
| :--------------------------------------------------------------------------------------------------------------------- | :----------- | :---------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[reset_round.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/reset_round.rs)** | **1–87**     | **[NEW]** `reset_round` instruction: zeroes `current_round_issued`, optionally updates `round_limit_tokens` | Enables multi-phase releases for Mining-type projects. Admin calls this between rounds to open a new allocation window without needing a full contract upgrade. Guards prevent resetting after mint authority is revoked. |

---

### Step 1.8 — `mod.rs` + `lib.rs` (Wiring)

| File                                                                                                   | Line Numbers     | Feature Added                                                                          | Reason for Addition                                                                                                                      |
| :----------------------------------------------------------------------------------------------------- | :--------------- | :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **[mod.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/mod.rs)** | **11–12, 26–27** | `mod issue_tokens` + `mod reset_round` with `pub use` glob re-exports                  | Registers the two new modules so the `#[program]` macro can resolve their `Accounts` structs and handler functions.                      |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/lib.rs)**                | **87–103**       | `issue_tokens(amount: u64)` + `reset_round(new_round_limit: Option<u64>)` instructions | Exposes the two new handlers as public program entrypoints, making them callable from TypeScript clients and the compliance program CPI. |

---

### Step 1.9 — `external_state.rs` + `subscribe_investment.rs` (Compliance Program Sync)

| File                                                                                                                                          | Line Numbers | Feature Added                                                                                                | Reason for Addition                                                                                                                                                                                                                          |
| :-------------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **13–20**    | `ProjectStatus` enum mirror (byte-identical to registry's enum)                                              | The compliance program deserialises `ProjectAccount` manually from raw bytes. The enum variant order **must** be identical to the registry's definition to avoid silent data corruption.                                                     |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **23–29**    | `AssetType` enum mirror                                                                                      | Same reason — byte layout must match the registry exactly. Compliance program needs `AssetType` to be deserialisable even if it doesn't inspect the field directly.                                                                          |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **54**       | `is_active: bool` removed; `status: ProjectStatus` added in its place                                        | Keeps the field order and byte offsets in sync with the updated registry `ProjectAccount`. Any field order mismatch causes all subsequent fields to read corrupted values.                                                                   |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **57–59**    | `round_limit_tokens: u64`, `current_round_issued: u64`, `asset_type: AssetType` added                        | Completes the byte-layout mirror so the `SIZE` constant and deserialization remain byte-perfect after Step 1.1.                                                                                                                              |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **63–98**    | `SIZE` recalculated identically to registry's constant                                                       | Acts as a compile-time documentation assertion that both programs agree on the account layout.                                                                                                                                               |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **100–106**  | `Default` impls for `ProjectStatus` and `AssetType`                                                          | Needed by `#[derive(Default)]` on `ProjectAccount`. Without these, the compliance program fails to compile.                                                                                                                                  |
| **[subscribe_investment.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/compliance_logic/subscribe_investment.rs)** | **80–85**    | `project.is_active && !project.is_paused` → `project.status == ProjectStatus::Funding && !project.is_paused` | Aligns the subscription eligibility check with the new enum-based lifecycle. Investors can only subscribe when the project is explicitly in the `Funding` phase — `Draft`, `Active`, `Completed`, and `Canceled` all reject new investments. |

---

### IDL Sync — `idl.json` (Solana Playground Manual Update)

| File                                                                                        | Line Numbers | Feature Added                                                                                                                                    | Reason for Addition                                                                                                            |
| :------------------------------------------------------------------------------------------ | :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **40–43**    | `mint`, `mintAuthorityPda`, `tokenProgram` accounts added to `revokeMintAuthority` instruction                                                   | Reflects the new SPL CPI accounts required by the upgraded `revoke_mint_authority` handler.                                    |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **67**       | `isActive: bool` → `newStatus: { defined: "ProjectStatus" }` in `updateProjectStatus` args                                                       | Matches the refactored instruction signature. TypeScript clients pass a `ProjectStatus` enum object instead of a boolean.      |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **107–133**  | `issueTokens` + `resetRound` instruction definitions                                                                                             | Registers the two new Phase 1 instructions so TypeScript clients can discover and call them.                                   |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **170–175**  | `ProjectAccount` definition: `isActive` removed, `status`, `roundLimitTokens`, `currentRoundIssued`, `assetType` added                           | Keeps the IDL account schema in sync with the Rust struct so Anchor can correctly decode on-chain data in the frontend.        |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **198–200**  | `assetType` + `roundLimitTokens` added to `CreateProjectParams` type                                                                             | Frontend now passes these fields when creating a project.                                                                      |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **214–250**  | `roundLimitTokens: Option<u64>`, `assetType: Option<AssetType>` added to `ProjectUpdateParams`; `ProjectStatus` + `AssetType` enum types defined | Enables TypeScript clients to pass the new optional update fields, and teaches Anchor how to serialise the two new enum types. |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **266–280**  | `TokensMinted` + `RoundReset` event definitions                                                                                                  | Allows frontend listeners to decode the new minting and round-reset events from transaction logs.                              |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **326–340**  | `PauseStateChanged` → `ProjectStateChanged` event (with `oldStatus`/`newStatus` fields)                                                          | Matches the renamed Rust event struct. Old `oldIsActive`/`newIsActive` bool fields replaced with typed `ProjectStatus` fields. |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)** | **400–418**  | `InvalidStatusTransition` (6012), `MintNotSet` (6013), `RoundLimitExceeded` (6014) error codes                                                   | Registers the 3 new on-chain errors so TypeScript clients can parse and display meaningful error messages to admins.           |

---

## Feature: Cross-Program Stabilization & BorshIoError Resolution

**Timestamp:** 2026-04-21T14:20:00+06:00
Resolved the critical `BorshIoError` preventing the Compliance program from reading Registry data. Implemented a robust, flexible deserialization strategy to handle dynamic account sizes and slack space.

### 1. Smart Contract Hardening (Anchor / Rust)

| File Name                                                                                                                                     | Line Numbers | Feature Added            | Reason for Addition                                                                                                           |
| :-------------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **[subscribe_investment.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/compliance_logic/subscribe_investment.rs)** | **77-79**    | Flexible Deserialization | Switched from `try_from_slice` to `deserialize` to correctly handle trailing zeros/slack space in fixed-size account buffers. |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **28**       | Struct Refactoring       | Reverted manual padding fields as the new flexible deserialization makes them unnecessary and cleaner to maintain.            |

### 2. Simulation & Verification

| File Name                                                                                     | Line Numbers  | Feature Added           | Reason for Addition                                                                                                              |
| :-------------------------------------------------------------------------------------------- | :------------ | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **[simulate-full-flow.ts](file:///c:/Rupom/Projects/AURUMCHAIN/tests/simulate-full-flow.ts)** | **34, 90-91** | Dynamic Test Parameters | Updated the simulation to use Project ID 28 (Nepal) and satisfied the 1,000 USDC minimum requirement to verify end-to-end logic. |

---

## Feature: Dynamic Token Decimals Configuration

**Timestamp:** 2026-04-20T14:10:00+06:00
Implemented per-project decimal configuration (e.g., 7, 9) to allow administrators full control over token precision during launch. This ensures alignment between the Admin Dashboard and on-chain explorers like Solscan.

### 1. Web3 Service & Scaling Logic

| File Name                                                                                                         | Line Numbers                          | Feature Added       | Reason for Addition                                                                                                                            |
| :---------------------------------------------------------------------------------------------------------------- | :------------------------------------ | :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **[projectRegistryService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/projectRegistryService.ts)** | **128-135**, **158-161**, **192-201** | Dynamic Mint Params | Updated `createProjectWithMint` to accept `tokenDecimals` and scale `supply_cap` using dynamic power-of-10 multipliers instead of hardcoded 6. |
| **[projectRegistryService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/projectRegistryService.ts)** | **128-144**                           | Syntax Repair       | Restored missing function signature `async createProjectWithMint` to resolve a TypeScript compilation deadlock.                                |

### 2. Admin Dashboard & UI

| File Name                                                                                                  | Line Numbers      | Feature Added        | Reason for Addition                                                                                          |
| :--------------------------------------------------------------------------------------------------------- | :---------------- | :------------------- | :----------------------------------------------------------------------------------------------------------- |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **30-38**, **61** | Decimals Form State  | Added `token_decimals` to the project creation state with a default value of 9 (per user preference).        |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **80**, **307**   | Numeric Input Parser | Updated the form handler and `resetForm` function to support numeric decimal selection.                      |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **696-710**       | Decimals UI Field    | Added a new numeric input field in the "Token Details" section of the project creation form.                 |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **914**           | Adaptive Formatting  | Updated the project list rendering to format token amounts according to each project's unique decimal count. |

---

## Feature: Backend RPC Integration & Cross-Program Security Fix (Milestone 2)

**Timestamp:** 2026-04-20T13:45:00+06:00
Finalized the administrative blockchain infrastructure for secure server-side settlement. Implemented a custom security patch in the Compliance program to resolve the `3007` PDA ownership deadlock, enabling trustless cross-program data sharing.

### 1. Administrative Infrastructure (Backend RPC)

| File Name                                                                                                         | Line Numbers    | Feature Added                | Reason for Addition                                                                                            |
| :---------------------------------------------------------------------------------------------------------------- | :-------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **[serverAnchorProvider.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/clients/serverAnchorProvider.ts)**      | **1-38 [NEW]**  | **[NEW]** Headless Provider  | Implemented server-side Anchor signing using administrative private keys for autonomous blockchain settlement. |
| **[adminBlockchainService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/adminBlockchainService.ts)** | **1-103 [NEW]** | **[NEW]** Admin Orchestrator | Created centralized service for `settleInvestment` and `updateProjectStatus` via administrative RPC calls.     |
| **[complete/route.ts](file:///c:/Rupom/Projects/AURUMCHAIN/app/api/investments/[id]/complete/route.ts)**          | **7-40**        | API-to-Blockchain Link       | Integrated the Admin service into the investment completion route to trigger automated on-chain settlement.    |
| **[package.json](file:///c:/Rupom/Projects/AURUMCHAIN/package.json)**                                             | **12-14**       | Test Orchestration           | Added `test:full-flow` script to facilitate automated end-to-end verification.                                 |

### 2. Smart Contract Security Patch (Rust / Anchor)

| File Name                                                                                                                                     | Line Numbers | Feature Added            | Reason for Addition                                                                                                                  |
| :-------------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **[external_state.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/external_state.rs)**                        | **3, 30**    | Cross-Program Struct     | Redefined `ProjectAccount` as a shared data layout (removing `#[account]`) to bypass ownership deadlocks.                            |
| **[subscribe_investment.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/compliance_logic/subscribe_investment.rs)** | **26-119**   | Manual Sec. Verification | Replaced macro-driven validation with manual PDA seed and owner checks to allow the Compliance program to safely read Registry data. |

### 3. Verification & Tracking

| File Name                                                                                     | Line Numbers     | Feature Added                  | Reason for Addition                                                                                           |
| :-------------------------------------------------------------------------------------------- | :--------------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **[models.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/domains/investments/models.ts)**       | **24-28, 75-77** | Blockchain Metadata            | Expanded the Investment model to persist `blockchainSubscriptionId` and `investorWallet` in Supabase.         |
| **[service.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/domains/investments/service.ts)**     | **48-54**        | Data Persistence               | Updated the investment service to ensure SOL-based transaction hashes are stored for investor auditing.       |
| **[check-on-chain.ts](file:///c:/Rupom/Projects/AURUMCHAIN/tests/check-on-chain.ts)**         | **1-64 [NEW]**   | **[NEW]** CLI Audit Tool       | Created a terminal utility to inspect on-chain subscription states without a web browser.                     |
| **[simulate-full-flow.ts](file:///c:/Rupom/Projects/AURUMCHAIN/tests/simulate-full-flow.ts)** | **1-118 [NEW]**  | **[NEW]** Lifecycle Simulation | Built a comprehensive script to verify the flow from Wallet Registration -> Subscription -> Admin Settlement. |

---

## Feature: Robust Transaction Confirmation & Identity Hashing

**Timestamp:** 2026-04-20T09:58:00+06:00
Resolved the `signatureSubscribe` WebSocket error and `TransactionExpiredBlockheightExceededError` by implementing a polling-based confirmation strategy. Also fixed the on-chain `EmptyIdentityHash` (6011) error by generating real SHA-256 hashes of investor applicant IDs.

### 1. Robust Web3 Infrastructure

| File Name                                                                                                         | Line Numbers         | Feature Added            | Reason for Addition                                                                                                    |
| :---------------------------------------------------------------------------------------------------------------- | :------------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **[transactionUtils.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/utils/transactionUtils.ts)**                | **1-62**             | **[NEW]** Robust Polling | Implemented a reliable `getSignatureStatus` polling mechanism to bypass unstable WebSocket connections in the browser. |
| **[complianceService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/complianceService.ts)**           | **1, 6, 99-118**     | Priority Fees & Polling  | Integrated `ComputeBudgetProgram` for priority fees and switched to robust polling for transaction confirmation.       |
| **[investmentService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/investmentService.ts)**           | **1, 5, 49-68**      | Priority Fees & Polling  | Hardened the subscription flow with priority fees and reliable confirmation logic.                                     |
| **[projectRegistryService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/projectRegistryService.ts)** | **17, 240, 331-345** | Shared Utility Sync      | Refactored to use the central `transactionUtils` library and removed redundant internal polling code.                  |

### 2. Compliance Logic Hardening

| File Name                                                                                                      | Line Numbers  | Feature Added            | Reason for Addition                                                                                                               |
| :------------------------------------------------------------------------------------------------------------- | :------------ | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **[ComplianceReviewList.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ComplianceReviewList.tsx)** | **27-37, 51** | SHA-256 Identity Hashing | Implemented cryptographically secure hashing of applicant IDs to satisfy the smart contract's non-zero identity hash requirement. |

---

## Feature: Wallet Connection Stability & Duplicate Fix

**Timestamp:** 2026-04-20T09:27:00+06:00
Resolved the `500 Internal Server Error` during wallet connection caused by duplicate key violations and fixed the resulting infinite loop in the terminal.

### 1. Backend Service Hardening

| File                                                                                 | Line Numbers | Feature Added        | Reason for Addition                                                                                                                 |
| :----------------------------------------------------------------------------------- | :----------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **[service.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/domains/wallet/service.ts)** | **38-59**    | `upsert` Wallet Link | Switched from `insert` to `upsert` to handle reconnection of previously used wallets without violating database unique constraints. |

### 2. Frontend Loop Prevention

| File                                                                             | Line Numbers  | Feature Added            | Reason for Addition                                                                                                                      |
| :------------------------------------------------------------------------------- | :------------ | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **[Header.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/components/Header.tsx)** | **19, 63-84** | Error-Aware Auto-Trigger | Integrated `walletError` detection in the global Header to break recursive connection attempts and persist failures in `sessionStorage`. |

---

## Feature: Project Registry Counter Calibration (AC-BC-000)

**Timestamp:** 2026-04-20T09:15:00+06:00
Resolved the "Unauthorized" PDA seed collision deadlock by implementing an on-chain calibration instruction. This allowed jumping the `project_count` from 0 to 17, ensuring new projects don't collide with stale on-chain accounts.

### 1. Smart Contract Hardening (Anchor / Rust)

| File                                                                                                                                 | Line Numbers | Feature Added               | Reason for Addition                                                                                           |
| :----------------------------------------------------------------------------------------------------------------------------------- | :----------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **[calibrate_registry.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/calibrate_registry.rs)** | **1-29**     | **[NEW]** Calibration Logic | Implemented the rescue handler to allow the `super_admin` to manually synchronize the global project counter. |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/lib.rs)**                                              | **77-84**    | Program Entry Point         | Added the `calibrate_registry` instruction to the main program dispatcher.                                    |
| **[mod.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/mod.rs)**                               | **10, 22**   | Module Export               | Exported the new logic handler to ensure the `#[program]` macro can resolve the instruction context.          |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)**                                          | **99-107**   | Schema Metadata sync        | Registered the new instruction in the IDL to enable TypeScript clients to call the calibration method.        |

### 2. Integration & Rescue Tooling

| File                                                                                                                        | Line Numbers | Feature Added               | Reason for Addition                                                                                                          |
| :-------------------------------------------------------------------------------------------------------------------------- | :----------- | :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **[projectRegistryRepository.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/repositories/projectRegistryRepository.ts)** | **207-222**  | `calibrateRegistry` Builder | Added the instruction builder to the repository layer for administrative rescue operations.                                  |
| **[projectRegistryService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/projectRegistryService.ts)**           | **110-121**  | Calibration Service         | Implemented the service-level orchestration to send and confirm the calibration transaction.                                 |
| **[calibrate-registry.ts](file:///c:/Rupom/Projects/AURUMCHAIN/scripts/calibrate-registry.ts)**                             | **1-62**     | **[NEW]** Rescue Script     | Created a standalone specialized script to jump the on-chain counter to 17, effectively clearing the PDA collision deadlock. |

---

## Feature: Solana Wallet Linking (Handshake)

**Timestamp:** 2026-04-19T14:35:44+06:00
Migrated the existing EVM-based wallet connection to a Solana-native cryptographic verify-on-connect flow.

### `supabase/migrations/010_update_wallet_address_constraint.sql`

| Line Numbers   | Feature Added      | Reason for Addition                                                                                                            |
| :------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **1-22 (All)** | Database Migration | Dropped the EVM-specific hex address constraint and replaced it with a Base58-compliant alphanumeric constraint (32-44 chars). |

### `lib/domains/shared/schemas.ts`

| Line Numbers | Feature Added      | Reason for Addition                                                                                                  |
| :----------- | :----------------- | :------------------------------------------------------------------------------------------------------------------- |
| **8**        | Updated Validation | Renamed `ethereumAddressSchema` to `walletAddressSchema` and updated the regex to support Solana public key formats. |

### `lib/domains/wallet/models.ts`

| Line Numbers  | Feature Added       | Reason for Addition                                                                                                    |
| :------------ | :------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| **6, 12, 40** | Domain Schema Shift | Replaced the Ethereum-specific address requirements with the new generic `walletAddressSchema` for all linking models. |

### `lib/domains/wallet/service.ts`

| Line Numbers   | Feature Added          | Reason for Addition                                                                                                          |
| :------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **9-10**       | New Dependencies       | Integrated `tweetnacl` and `bs58` for server-side Solana signature processing.                                               |
| **22, 42, 62** | Case Sensitivity       | Removed `.toLowerCase()` from wallet address processing to preserve the accuracy of Solana Base58 strings.                   |
| **90-101**     | Handshake Verification | Implemented `nacl.sign.detached.verify` to perform 100% secure, offline-safe cryptographic verification of wallet ownership. |

### `app/api/wallet/active/route.ts`

| Line Numbers   | Feature Added     | Reason for Addition                                                                                                            |
| :------------- | :---------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **1-32 (All)** | Active Wallet API | Created a new endpoint to allow the frontend to detect if the currently connected wallet has already been linked and verified. |

### `lib/web3/wallet/walletLinkService.ts`

| Line Numbers   | Feature Added       | Reason for Addition                                                                                                    |
| :------------- | :------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| **1-76 (All)** | Web3 Client Service | Developed the two-step linking orchestrator (Register intent -> Request Signature -> Submit for Backend Verification). |

### `hooks/useWalletLink.ts`

| Line Numbers   | Feature Added       | Reason for Addition                                                                                             |
| :------------- | :------------------ | :-------------------------------------------------------------------------------------------------------------- |
| **1-71 (All)** | React Security Hook | Managed complex UI states (linking, verified, error) for the handshake, ensuring a smooth user onboarding flow. |

### `components/blockchain/WalletStatusBadge.tsx`

| Line Numbers     | Feature Added       | Reason for Addition                                                                                                            |
| :--------------- | :------------------ | :----------------------------------------------------------------------------------------------------------------------------- |
| **6, 19, 43-51** | Verification Prompt | Integrated logic to detect unverified wallets and display a blue "Ownership Not Verified" badge with a click-to-verify action. |

### `tests/mocks/supabaseMock.ts`

| Line Numbers   | Feature Added   | Reason for Addition                                                                                                       |
| :------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **1-30 (All)** | Mocking Utility | Created a reusable chainable mock for Supabase Select/Insert/Update/Single operations to facilitate backend unit testing. |

### `lib/domains/wallet/__tests__/service.test.ts`

| Line Numbers    | Feature Added       | Reason for Addition                                                                                                       |
| :-------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------ |
| **1-137 (All)** | Security Unit Suite | Implemented comprehensive tests for happy paths, forgeries, and malformed inputs to ensure the handshake is tamper-proof. |

### `wallet_linking_guide.md`

| Line Numbers   | Feature Added      | Reason for Addition                                                                                                    |
| :------------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **1-38 (All)** | User Documentation | Created a simple "Digital Handshake" guide for non-technical users explaining the security benefits of wallet linking. |

# Frontend & Architecture Changes Documentation

## [2026-04-18 15:50] - Test Environment Optimization & Final SIWS Polish

### Features: 100% Green Test Suite, Environment Polyfills, Clean Console

| File Name               | Line Range | Feature                | Reason for Change                                                                                 |
| :---------------------- | :--------- | :--------------------- | :------------------------------------------------------------------------------------------------ |
| `jest.setup.js`         | 2-5        | **Env Polyfills**      | Added `TextEncoder`/`TextDecoder` globals to resolve ReferenceErrors in blockchain service tests. |
| `WalletButton.test.tsx` | 10-25      | **Mock Stabilization** | Consolidated `next/dynamic` mocks to eliminate React `act()` warnings and fix rendering errors.   |
| `package.json`          | 55         | **Security Logic**     | Integrated `tweetnacl` for Ed25519 cryptographic signature verification in SIWS flow.             |

---

## [2026-04-18 15:45] - Admin Security (Hardened) & Testing Infrastructure

### Features: SIWS Compliance, Automated Verification, Logic Hardening

| File Name                                     | Line Range | Feature                | Reason for Change                                                                             |
| :-------------------------------------------- | :--------- | :--------------------- | :-------------------------------------------------------------------------------------------- |
| `context/AdminSecurityContext.tsx`            | 16, 60-102 | **SIWS Hardening**     | Implemented Ed25519 signature verification and secure nonces for real cryptographic security. |
| `components/blockchain/WalletStatusBadge.tsx` | 33-85      | **Enum Refinement**    | Updated logic to handle Anchor enums and added interactive status tooltips.                   |
| `package.json`                                | 8-9, 40-55 | **Test Integration**   | Added Jest scripts and dependencies for automated frontend verification.                      |
| `jest.config.js`                              | 1-20       | **Test Runner Config** | Established Next.js-optimized Jest configuration with Solana ESM support.                     |
| `tsconfig.json`                               | 25         | **Type Definition**    | Included `@testing-library/jest-dom` types for specialized unit test matchers.                |
| `WalletButton.test.tsx` [NEW]                 | 1-60       | **Unit Testing**       | Created automated tests for Wallet connection, balance, and truncation logic.                 |
| `WalletStatusBadge.test.tsx` [NEW]            | 1-70       | **Role Verification**  | Created automated tests for Admin/Verified/Restricted role detection.                         |

---

---

## Feature: Admin Security Hardening (SIWS Implementation)

**Timestamp:** 2026-04-18T15:15:00+06:00
Implemented Sign In With Solana (SIWS) for administrative routes. This upgrade transitions the security model from a simple address check to a mandatory cryptographic proof-of-ownership, effectively neutralizing client-side impersonation risks.

### 1. Security Logic & Context

| File                                                                                                  | Line Numbers | Feature Added                | Reason for Addition                                                                                                                                                     |
| :---------------------------------------------------------------------------------------------------- | :----------- | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[AdminSecurityContext.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/context/AdminSecurityContext.tsx)** | **6-44**     | `isVerified` & `verifyAdmin` | Introduced session-based verification state and a signature challenge. Admins now must sign a unique nonce to prove they hold the private key of the authorized wallet. |

### 2. Access Protection UI

| File                                                                                       | Line Numbers | Feature Added            | Reason for Addition                                                                                                                                                           |
| :----------------------------------------------------------------------------------------- | :----------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[AdminGuard.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/AdminGuard.tsx)** | **17-110**   | "Verify Identity" Shield | Added a high-security lock screen for authorized but unverified wallets. Restructured the guard logic to enforce a two-stage verification (Address Check -> Signature Proof). |

---

## Feature: Premium Wallet Setup & Identity Unification (EPIC 3)

**Timestamp:** 2026-04-18T15:10:00+06:00
Fulfillment of EPIC 3 by polishing the wallet interaction layer and unifying it with the platform's existing Supabase identity system. This update provides a premium "Identity Card" UX while resolving critical WebSocket stability errors in the wallet connection lifecycle.

### 1. Hook & Stability Layer

| File                                                                                            | Line Numbers | Feature Added          | Reason for Addition                                                                                                                                                        |
| :---------------------------------------------------------------------------------------------- | :----------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[useWalletConnection.ts](file:///c:/Rupom/Projects/AURUMCHAIN/hooks/useWalletConnection.ts)** | **18-50**    | Stable Balance Polling | Removed the flaky WebSocket `onAccountChange` listener which was causing `ws error: undefined` during Turbopack hot reloads. Replaced with a robust 60s polling mechanism. |

### 2. Premium UI & Identity Unification

| File                                                                                                          | Line Numbers         | Feature Added              | Reason for Addition                                                                                                                                                 |
| :------------------------------------------------------------------------------------------------------------ | :------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[WalletButton.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/blockchain/WalletButton.tsx)**           | **10-65**            | Unified Identity Card      | Refactored to accept `profileName` from Supabase. Merges the professional name and cryptographic balance into a single premium UI element to eliminate duplication. |
| **[WalletStatusBadge.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/blockchain/WalletStatusBadge.tsx)** | **1-75**             | Intelligent Role Tracking  | **[NEW]** Added a role-aware badge system that recognizes "Super Admin" and "Administrator" roles, providing elevated trust signals for platform owners.            |
| **[Header.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/components/Header.tsx)**                              | **107-145, 209-232** | Responsive Identity Layout | Integrated the unified identity components and removed redundant Supabase "User" buttons to streamline the global navigation experience.                            |

### 3. Administrative UI Cleanup

| File                                                                                                | Line Numbers  | Feature Added           | Reason for Addition                                                                                                                      |
| :-------------------------------------------------------------------------------------------------- | :------------ | :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **[admin/page.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/admin/page.tsx)**                       | **9, 38**     | Body Redundancy Removal | Removed the secondary `AdminWalletButton` from the dashboard body to eliminate visual clutter and centralize the identity in the Header. |
| **[admin/projects/page.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/admin/projects/page.tsx)**     | **10, 43**    | Management UI Cleanup   | Removed redundant wallet buttons from the project management header, focusing the design on registry tasks.                              |
| **[admin/compliance/page.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/admin/compliance/page.tsx)** | **10, 89-93** | Compliance View Polish  | Removed redundant buttons and fixed a JSX parsing error (orphaned `div`) created during the transition to the unified Header identity.   |

---

---

## Feature: Transfer Validation Gate (AC-BC-202) & Final Compliance Hardening

**Timestamp:** 2026-04-18T14:55:00+06:00
Finalized the logic-gate architecture for the Compliance program. Standardized on-chain reason codes for transfer rejection and resolved critical IDL naming mismatches that were blocking TypeScript integration.

### 1. Compliance Logic Hardening (Anchor / Rust)

| File                                                                                                                                    | Line Numbers    | Feature Added                 | Reason for Addition                                                                                                                                                              |
| :-------------------------------------------------------------------------------------------------------------------------------------- | :-------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[transfer_validate.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/compliance_logic/transfer_validate.rs)** | **39-105**      | `amount` param & Reason Codes | Added the `u64` amount parameter and implemented the 0x01-0x06 reason code standard to provide granular rejection reasons to the platform backend.                               |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/lib.rs)**                                              | **6, 54-58**    | IDL Naming Fix                | Refactored the `TransferDecision` return type to remove the `crate::state::` namespace. This ensures the Anchor-generated IDL is compatible with the frontend TypeScript client. |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/idl.json)**                                          | **81, 134-142** | Schema Metadata Patch         | Manually synced the IDL instruction arguments and return types to match the hardened Rust implementation.                                                                        |

### 2. Full-Stack Integration & Testing

| File                                                                                                              | Line Numbers | Feature Added                    | Reason for Addition                                                                                                                                          |
| :---------------------------------------------------------------------------------------------------------------- | :----------- | :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[complianceRepository.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/repositories/complianceRepository.ts)** | **105-121**  | `getTransferValidateInstruction` | Added the instruction builder to the repository layer for use in simulation-mode checks.                                                                     |
| **[complianceService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/complianceService.ts)**           | **131-180**  | `validateTransfer` (Sim Mode)    | Implemented the service-level check that allows the backend to "Ask" the blockchain for a transfer decision without executing an on-chain transaction.       |
| **[eligibility.ts](file:///c:/Rupom/Projects/AURUMCHAIN/tests/eligibility.ts)**                                   | **1-180**    | Consolidated Audit Suite         | Created a unified, collision-protected test suite. Includes high-resolution timestamp hashes and `sleep` delays to ensure 100% reliability on Solana Devnet. |

---

---

## Feature: Compliance Architecture Refactor & Playground Testing (EPIC 2.1 Completion)

**Timestamp:** 2026-04-18T13:20:00+06:00
Finalized the modular refactor of the `compliance_transfer` program to ensure 100% compatibility with Solana Playground. Implemented a comprehensive TypeScript test suite to verify the on-chain allow-list, AML security blocks, and authority constraints.

### 1. Smart Contract Modularization (Anchor / Rust)

| File                                                                                                                         | Line Numbers | Feature Added             | Reason for Addition                                                                                                                  |
| :--------------------------------------------------------------------------------------------------------------------------- | :----------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/lib.rs)**                                   | **1-133**    | Pure Modular Refactor     | Restored the program to the "Logic-First" pattern used in Project Registry. Resolves persistent `E0583` resolution errors on Devnet. |
| **[state/mod.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/state/mod.rs)**                       | **1-40**     | Centralized State Exports | Consolidated account structs and enums with glob re-exports for cleaner IDL generation and instruction accessibility.                |
| **[compliance_logic/mod.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/compliance_logic/mod.rs)** | **1-35**     | Instruction Glob Exports  | Re-aligned logic handlers to ensure the `#[program]` macro can resolve hidden Anchor context types.                                  |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/idl.json)**                               | **76-364**   | Schema Hardening          | Updated events and instruction definitions to support the full compliance logic gate.                                                |

### 2. Testing & Verification (Solana Playground)

| File                                                                                                         | Line Numbers | Feature Added           | Reason for Addition                                                                                                                                                |
| :----------------------------------------------------------------------------------------------------------- | :----------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[eligibility.ts](file:///c:/Rupom/Projects/AURUMCHAIN/tests/eligibility.ts)**                              | **1-137**    | **[NEW]** TS Test Suite | Implemented a high-coverage test suite for the Playground "Test" tab. Verifies Happy Paths (KYC Approved), AML Security Blocks, and Unauthorized Access rejection. |
| **[task.md](file:///c:/Users/radwa/.gemini/antigravity/brain/722e2685-c48f-4809-81de-5cd38505a9db/task.md)** | **30-45**    | Progress Tracking       | Updated EPIC 2 tracking to reflect the shift to Playground-native testing and the completion of sub-task 201-4.                                                    |

---

---

## Feature: Project Registry Security Hardening & Modular Stabilization (Epic 1 Finalization)

**Timestamp:** 2026-04-18T10:57:00+06:00
Finalized the security architecture for the Project Registry. Implemented a 3-tier authority system, a global emergency "Kill-Switch," and stabilized the modular architecture using the Unique Handler Pattern to resolve persistent Anchor macro resolution issues.

### 1. Security & Authority Hardening (Anchor / Rust)

| File                                                                                                                                   | Line Numbers | Feature Added              | Reason for Addition                                                                                                                                                                                                      |
| :------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/lib.rs)**                                                | **8-106**    | Unique Handler Dispatch    | Refactored the entry point to call uniquely named handlers (e.g., `handle_create_project`). This resolves the "unresolved import crate" error permanently by eliminating namespace collisions in the `#[program]` macro. |
| **[initialize_control.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/initialize_control.rs)**   | **21-25**    | Authority Initialization   | Implemented the 3-tier role setup (Super Admin, Operational Admin, Upgrade Authority) as part of the production-ready security spec.                                                                                     |
| **[transfer_authority.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/transfer_authority.rs)**   | **19-25**    | "Designate & Accept" logic | Added the secure authority transfer instruction requiring dual signatures to prevent accidental or malicious administrative hijacking.                                                                                   |
| **[set_emergency_pause.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/set_emergency_pause.rs)** | **1-40**     | Global Kill-Switch         | **[NEW]** Added a protocol-level emergency pause toggled by the Super Admin to halt all administrative operations in case of a exploit detection.                                                                        |
| **Instruction Files (9x)**                                                                                                             | **Varies**   | Unique Handler Renaming    | Renamed all internal `handler` functions to unique names (e.g., `handle_record_tokens_issued`) to ensure clean exports in the modular system.                                                                            |

### 2. Modular Architecture Stabilization

| File                                                                                                   | Line Numbers | Feature Added                | Reason for Addition                                                                                                                                                                    |
| :----------------------------------------------------------------------------------------------------- | :----------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[mod.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/registry_logic/mod.rs)** | **1-22**     | Encapsulated Glob Modularity | Switched to private sub-modules with glob re-exports. This surfaces hidden Anchor metadata types required for IDL generation while keeping each instruction in its own dedicated file. |
| **All Instructions**                                                                                   | **Header**   | Emergency Guard Integration  | Added `require!(!control.is_emergency_paused)` to every critical path to ensure the security "Kill-Switch" is enforced on-chain.                                                       |

---

## Feature: Modular Project Registry & Atomic Status Control (AC-BC-102 Implementation)

**Timestamp:** 2026-04-18T08:50:00+06:00
Transformed the project registry from a monolithic program into a modular, instruction-based architecture. Implemented the unified `update_project_status` instruction, corrected data schemas, and synced the entire integration layer (IDL, Repository, Service, and Admin Dashboard) to support atomic compliance holds.

### 1. Smart Contract Refactor (Anchor / Rust)

| File                                                                                                                                     | Line Numbers | Feature Added                       | Reason for Addition                                                                                                                    |
| :--------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/lib.rs)**                                                  | **1-85**     | Modular Entry Point                 | Refactored into separate `instructions` and `state` modules. The main file now only acts as a clean dispatcher.                        |
| **[project_account.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/state/project_account.rs)**                    | **1-55**     | Schema Correction & Timestamps      | Fixed `distribution_cadence` to `u8`, added `created_at: i64`, and consolidated pause flags into a single `is_paused` field.           |
| **[update_project_status.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/instructions/update_project_status.rs)** | **1-54**     | `update_project_status` Instruction | Implemented atomic status management (Active/Paused). Emits `PauseStateChanged` event with before/after snapshots for better auditing. |
| **[create_project.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/instructions/create_project.rs)**               | **105-115**  | Timestamp Initialization            | Added logic to capture `Clock::get()?.unix_timestamp` during project creation.                                                         |
| **[update_project_status_test.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/tests/update_project_status_test.rs)**  | **1-44**     | Status Logic Unit Tests             | New test suite verifying happy paths and authority constraints for the new status control instruction.                                 |

### 2. Integration Layer (Web3 & IDL)

| File                                                                                                                        | Line Numbers    | Feature Added                          | Reason for Addition                                                                                             |
| :-------------------------------------------------------------------------------------------------------------------------- | :-------------- | :------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/project_registry/src/idl.json)**                                 | **Full Update** | Refined IDL                            | Updated schema definitions and instruction names to match the modular program structure.                        |
| **[projectRegistryRepository.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/repositories/projectRegistryRepository.ts)** | **115-135**     | `getUpdateProjectStatusInstruction`    | Replaced legacy individual toggle builders with a single, type-safe instruction builder for status updates.     |
| **[projectRegistryService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/projectRegistryService.ts)**           | **232-250**     | `updateProjectStatus` & Error Recovery | Added high-level update method and improved error parsing to catch "Account layout mismatch" (schema versions). |

### 3. Frontend & UI Sync

| File                                                                                                       | Line Numbers            | Feature Added               | Reason for Addition                                                                                                                            |
| :--------------------------------------------------------------------------------------------------------- | :---------------------- | :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ProjectsManagement.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ProjectsManagement.tsx)** | **334-386, 958-977**    | Consolidated "Pause" Toggle | Merged "Pause Inv." and "Pause Tx" into a single smart toggle. Implemented pre-update state fetching to prevent data race conditions on-chain. |
| **[page.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/projects/page.tsx)**                                 | **12-32, 209, 354-365** | Gallery Sync                | Updated Public Gallery to read the new `isPaused` and `createdAt` fields. Synced the "Invest" button disable logic with the new flag.          |
| **[route.ts](file:///c:/Rupom/Projects/AURUMCHAIN/app/api/projects/route.ts)**                             | **50-70**               | Hybrid Data Mapping Fix     | Updated the API route that merges Supabase + Blockchain data to correctly map the new schema fields to the frontend.                           |

---

## Feature: Compliance Program Integration & Admin Dashboard Stability

**Timestamp:** 2026-04-16T15:45:00+06:00
Finalized the full-stack integration of the `compliance_transfer` program. This update resolved critical visibility issues caused by Row-Level Security (RLS), eliminated 429 "Too Many Requests" RPC errors via UI throttling, and introduced a robust idempotent seeding system for test investors.

### 1. Database & Security (RLS Bypass)

| File                                                                                   | Line Numbers       | Feature Added                   | Reason for Addition                                                                                                                                              |
| :------------------------------------------------------------------------------------- | :----------------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[actions.ts](file:///c:/Rupom/Projects/AURUMCHAIN/app/admin/compliance/actions.ts)** | **3, 15, 62**      | `createAdminClient` Integration | Switched to the service-role client for all server actions. This allows admins to sync KYC data to the database by bypassing strict per-user RLS policies.       |
| **[page.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/admin/compliance/page.tsx)**     | **11, 14, 30, 59** | Admin-Gated Data Fetching       | Switched the dashboard to use the Admin Client for initial data loads. Ensures all pending KYC requests across the platform are visible to authorized officials. |

### 2. Frontend Performance & UX (RPC Throttling)

| File                                                                                                           | Line Numbers   | Feature Added                   | Reason for Addition                                                                                                                                                                             |
| :------------------------------------------------------------------------------------------------------------- | :------------- | :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ComplianceReviewList.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/components/admin/ComplianceReviewList.tsx)** | **150-200**    | Manual "Verify On-Chain" Button | Replaced automatic on-chain status checks with a manual trigger. This prevents 429 Rate Limit errors on Solana Devnet by stopping the browser from flooding the RPC with requests on page load. |
| **[useWalletEligibility.ts](file:///c:/Rupom/Projects/AURUMCHAIN/hooks/useWalletEligibility.ts)**              | **12, 22, 50** | `options.enabled` Flag          | Added an execution gate to the hook. Allows components to prevent automatic on-chain lookups until explicitly requested by the user.                                                            |
| **[page.tsx](file:///c:/Rupom/Projects/AURUMCHAIN/app/admin/compliance/page.tsx)**                             | **9**          | `export const revalidate = 0`   | Disables Next.js server-side caching for the admin dashboard, ensuring that newly seeded or approved users appear immediately on refresh.                                                       |

### 3. Service Layer & Validation

| File                                                                                                    | Line Numbers  | Feature Added         | Reason for Addition                                                                                                                                                          |
| :------------------------------------------------------------------------------------------------------ | :------------ | :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[complianceService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/complianceService.ts)** | **6, 45-148** | Anchor Enum Mapping   | Implemented logic to map UI-friendly numbers (0, 1, 2) to Anchor-required enum objects (`{ approved: {} }`). Resolves the "unable to infer src variant" serialization error. |
| **[complianceService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/complianceService.ts)** | **-**         | Server-Import Cleanup | Removed `lib/supabase/server` imports from the client-side service to fix build-time "Module Not Found" errors in the browser environment.                                   |

### 4. Testing & Infrastructure

| File                                                                                      | Line Numbers | Feature Added          | Reason for Addition                                                                                                                                                                        |
| :---------------------------------------------------------------------------------------- | :----------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[seed-test-users.ts](file:///c:/Rupom/Projects/AURUMCHAIN/scripts/seed-test-users.ts)** | **1-115**    | Idempotent Seed Script | Created a robust script that creates 3 mock investors (Alice, Bob, Charlie). Uses `Keypair.generate()` to ensure every mock wallet address is a cryptographically valid Solana public key. |

---

---

## Feature: Investor Eligibility Refresh & On-Chain Transfer Validation (AC-BC-201 & 202)

**Timestamp:** 2026-04-16T14:10:00+06:00
Finalized the implementation of on-chain eligibility refresh logic and comprehensive transfer validation. This update ensures that investor KYC/AML status can be updated/extended Trustlessly and provides a robust unit testing suite embedded directly in the program for verification within Solana Playground.

### 1. Compliance Program Logic (Anchor / Rust)

| File                                                                                       | Line Numbers    | Feature Added                     | Reason for Addition                                                                                                                                                                    |
| :----------------------------------------------------------------------------------------- | :-------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/lib.rs)** | **17, 463–517** | `refresh_eligibility` instruction | Enables administrators to update existing KYC/AML records (extending expiry or resetting status) after a Sumsub re-verification webhook, without needing to re-initialize the account. |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/lib.rs)** | **259–282**     | `RefreshVerifiedWallet` Context   | Defined the account validation logic for the refresh instruction, ensuring only authorized authorities can modify investor records.                                                    |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/lib.rs)** | **673–718**     | Rust Unit Testing Suite           | Added a `#[cfg(test)]` module to verify data structure sizing, PDA constraints, and status serialization directly in the program binary.                                               |
| **[lib.rs](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/lib.rs)** | **14–21**       | Instruction Renumbering           | Reorganized and renumbered instructions to support the new `refresh` entry point while maintaining a clean audit trail.                                                                |

### 2. Integration & Schema Sync

| File                                                                                           | Line Numbers | Feature Added      | Reason for Addition                                                                                                                                                                       |
| :--------------------------------------------------------------------------------------------- | :----------- | :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[idl.json](file:///c:/Rupom/Projects/AURUMCHAIN/programs/compliance_transfer/src/idl.json)** | **1–102**    | Full Schema Update | Replaced the "Hello World" placeholder with the actual `compliance_transfer` IDL, enabling frontend services to interact with all 7 program instructions, events, and custom error codes. |

---

---

## Feature: Project Registry Service Refactor & Transaction Stability (AC-BC-402 Completion)

**Timestamp:** 2026-04-15T16:20:00+06:00
Finalized the migration of all blockchain logic into a formal **Service-Repository** architecture. This refactor resolved several critical transaction failures related to Metaplex metadata encoding, Borsh serialization, and missing on-chain parameters.

### 1. New Core Infrastructure

| File                                                                                                                        | Line Numbers | Feature Added                | Reason for Addition                                                                                                                                                          |
| :-------------------------------------------------------------------------------------------------------------------------- | :----------- | :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[pdaHelpers.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/utils/pdaHelpers.ts)**                                      | **1–59**     | 🔑 Centralized PDA Helpers   | Centralized all seed-based address derivation (Projects, Registry, Metadata). Prevents "account mismatch" errors by ensuring every layer uses the same derivation logic.     |
| **[projectRegistryRepository.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/repositories/projectRegistryRepository.ts)** | **1–188**    | 📦 Instruction Repository    | Encapsulates all `@coral-xyz/anchor` method builders. Handles the complex `CreateProjectParams` struct mapping and PDA linkage for 10+ instructions.                         |
| **[projectRegistryService.ts](file:///c:/Rupom/Projects/AURUMCHAIN/lib/web3/services/projectRegistryService.ts)**           | **1–310**    | 🛠️ Multi-Instruction Service | Coordinates atomic project creation: SPL Mint -> Initialize -> Metaplex Metadata -> Registry Entry. Implements centralized Error handling and partial signing for new mints. |
| **[useProjectRegistry.ts](file:///c:/Rupom/Projects/AURUMCHAIN/hooks/useProjectRegistry.ts)**                               | **1–66**     | 🔄 Reactive Hydration Hook   | A unified hook for the frontend to fetch on-chain state. Decouples the UI from the underlying Solana SDK, simplifying maintenance.                                           |

### 2. Integration & Stability Fixes

| File                               | Line Numbers | Feature Added            | Reason for Addition                                                                                                                                  |
| :--------------------------------- | :----------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`projectRegistryRepository.ts`** | **49–63**    | Struct Argument Refactor | Fixed "too many arguments" error by wrapping positional arguments into a single IDL-compatible struct.                                               |
| **`projectRegistryService.ts`**    | **133**      | Metaplex Key Correction  | Fixed `createMetadataAccountArgsV3` key typo. Resolved "struct key expected" error during on-chain metadata registration.                            |
| **`projectRegistryService.ts`**    | **39–46**    | Service Error Recovery   | Implemented `try-catch` within `fetchProject` to return `null` instead of crashing the UI when an on-chain account doesn't exist yet.                |
| **`ProjectsManagement.tsx`**       | **110–136**  | Atomic Submission Flow   | Refactored `handleSubmit` to use the new atomic service. Captures on-chain project IDs and Mint addresses in a single pass for Supabase persistence. |
| **`api/projects/route.ts`**        | **12–74**    | Service-Proxy Fetching   | Replaced legacy fetchers with the new Service Layer. Enables read-only fetching of all registry projects on the server-side Public API.              |
| **`authority/page.tsx`**           | **33–41**    | Config Sync Fix          | Switched to `fetchRegistryConfig` with explicit `PublicKey` and `BN` casting to resolve TypeScript failures in the Authority management UI.          |

---

## Feature: Automated SPL Token Mint & Metaplex Metadata Integration

**Timestamp:** 2026-04-15T15:05:00+06:00
Implemented a professional, atomic project initialization flow. When an admin creates a project, the system now automatically generates a new SPL Token Mint, registers on-chain branding via Metaplex (Name, Symbol, URI), and links the mint to the registry in a single transaction.

### File: `lib/solana/projectRegistry.ts`

| Line Numbers | Feature Added                  | Reason for Addition                                                                                                                                                                                                |
| :----------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **4–16**     | Metaplex & SPL Token Imports   | Added `@solana/spl-token` and `@metaplex-foundation/mpl-token-metadata` to support on-chain asset creation.                                                                                                        |
| **51–63**    | `getMetadataPDA(mint)`         | Helper function to derive the Metaplex Metadata PDA account address using the standard seeds.                                                                                                                      |
| **73–155**   | `createOnChainProject` Rewrite | Completely overhauled to bundle 5 instructions: Mint Account Creation, Initialize Mint, Create Metadata, Create Registry Project, and Set Project Mint. Uses `partialSign(mintKeypair)` to authorize the new mint. |
| **142**      | Decimal/Supply Multiplier      | Forces `1,000,000` (6 decimals) multiplication for the `supplyCap` to ensure the on-chain raw units match the "Total Tokens" display.                                                                              |

### File: `components/admin/ProjectsManagement.tsx`

| Line Numbers | Feature Added           | Reason for Addition                                                                                                         |
| :----------- | :---------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **136–141**  | `mint_address` Capture  | Updated the submission handler to receive the newly generated `mintAddress` from the blockchain and pass it to the backend. |
| **919–931**  | 💎 Mint Address Display | Added a visual badge and direct link to Solscan for the Token Mint on every project card.                                   |

### File: `app/api/admin/projects/route.ts`

| Line Numbers | Feature Added              | Reason for Addition                                                                     |
| :----------- | :------------------------- | :-------------------------------------------------------------------------------------- |
| **61**       | `mint_address` Persistence | Updated the POST handler to save the automated mint address into the Supabase database. |

---

## Feature: On-Chain Authority Transfer Logic & Management UI

**Timestamp:** 2026-04-15T10:02:43+06:00
Implemented a secure, dual-signer authority transfer mechanism for the Project Registry. This includes the on-chain Rust instruction, a robust TypeScript Service-Repository layer with custom error parsing, and a dedicated premium management interface in the Admin Dashboard.

### File: `programs/project_registry/src/lib.rs`

| Line Numbers | Feature Added                       | Reason for Addition                                                                              |
| :----------- | :---------------------------------- | :----------------------------------------------------------------------------------------------- |
| **271–275**  | `AuthorityTransferred` event        | Provides an on-chain audit trail when registry control is changed.                               |
| **280–300**  | `transfer_authority` instruction    | Core logic for replacing Super Admin or Authority. Enforces dual-signer constraint for security. |
| **421–439**  | `TransferAuthority` accounts struct | Defines the required account inputs and constraints (Signers) for the transfer instruction.      |
| **632–668**  | Rust Unit Tests                     | Validates the state transition logic and authority replacement behavior locally.                 |

### File: `programs/project_registry/src/idl.json`

| Line Numbers | Feature Added                              | Reason for Addition                                                                    |
| :----------- | :----------------------------------------- | :------------------------------------------------------------------------------------- |
| **90–102**   | `transferAuthority` instruction definition | Registers the new instruction in the IDL so frontend clients can discover and call it. |
| **229–236**  | `AuthorityTransferred` event definition    | Allows frontend listeners to decode on-chain authority update events.                  |

### File: `lib/web3/repositories/projectRegistryRepository.ts` (NEW)

| Line Numbers | Feature Added                      | Reason for Addition                                                                              |
| :----------- | :--------------------------------- | :----------------------------------------------------------------------------------------------- |
| **All New**  | Registry account interaction logic | Encapsulates PDA derivation and low-level instruction building for the Project Registry program. |

### File: `lib/web3/services/projectRegistryService.ts` (NEW)

| Line Numbers | Feature Added                  | Reason for Addition                                                                                                             |
| :----------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **All New**  | Higher-level Authority Service | Orchestrates transaction execution and implements custom log parsing to extract specific program errors (e.g., `Unauthorized`). |

### File: `lib/solana/projectRegistry.ts`

| Line Numbers | Feature Added            | Reason for Addition                                                                                                               |
| :----------- | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **3**        | Relative Import Refactor | Switched `@/` to `../../` to support standalone script execution (npx tsx) which doesn't support Next.js path aliases by default. |

### File: `app/admin/page.tsx`

| Line Numbers | Feature Added                | Reason for Addition                                                                        |
| :----------- | :--------------------------- | :----------------------------------------------------------------------------------------- |
| **155–168**  | "Platform Authority" section | Adds a visual entry point in the main Admin Dashboard linking to the management interface. |

### File: `app/admin/authority/page.tsx` (NEW)

| Line Numbers | Feature Added                   | Reason for Addition                                                                                      |
| :----------- | :------------------------------ | :------------------------------------------------------------------------------------------------------- |
| **All New**  | Premium Authority Management UI | A glassmorphic admin interface allowing real-time state viewing and secure transfer of registry control. |

### File: `scripts/verify-authority-transfer.ts` (NEW)

| Line Numbers | Feature Added                   | Reason for Addition                                                                                                    |
| :----------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| **All New**  | Integration Verification Script | Lightweight CLI tool to verify that the Service Layer is correctly communicating with the# AurumChain Development Logs |

## [2026-04-19 15:58] - Global RPC Centralization

- **File:** `lib/web3/config/rpc.ts` [NEW]
  - **Feature:** Unified RPC Source of Truth
  - **Reason:** Created a central hub for all Solana connections. This allows the entire project to be swapped to a new provider by updating a single line in `.env`.
- **File:** `app/components/SolanaProvider.tsx`
  - **Feature:** Frontend RPC Synchronization
  - **Reason:** Linked the main React context to the global RPC hub to ensure the dashboard follows the Alchemy default.
- **File:** `scripts/*.ts`, `tests/*.ts`
  - **Feature:** Script & Tooling Synchronization
  - **Reason:** Migrated all maintenance tools to use the global RPC hub and the newly installed `dotenv` dependency for seamless environment loading.

## [2026-04-19 15:52] - Epic 1 Stability & Type Hardening

- **File:** `lib/web3/repositories/projectRegistryRepository.ts`
  - **Lines:** 170
  - **Feature:** Infrastructure Type Safety
  - **Reason:** Fixed Rust-style `bool` to TypeScript `boolean` to resolve compilation error blocking the build.
- **File:** `lib/web3/services/projectRegistryService.ts`
  - **Lines:** 194-220, 304-362
  * **Feature:** Transaction Stability (Priority Fees & Polling Fallback)
  * **Reason:** Implemented manual polling and priority fees (50k microlamports) to bypass Devnet congestion and Alchemy RPC websocket limitations (429 errors).
- **File:** `tests/verify-project-registry.ts`
  - **Lines:** 78-102
  * **Feature:** Dynamic Integration Testing
  * **Reason:** Updated test suite to sync with existing Project ID 16 ("18 April 2026") after discovering that ID 0 was blocked by stale data on-chain.
- **File:** `lib/web3/services/projectRegistryService.ts`
  - **Lines:** 37
  * **Feature:** API Exposure
  * **Reason:** Added `getProgramId()` to the service layer to allow tests and frontend to dynamically derive PDAs.
    istry. |

---

## Feature: Admin Dashboard Wallet Restriction & Persistence Fix

**Timestamp:** 2026-04-15T09:05:00+06:00
Implemented a dual-layer security model for the Admin Dashboard. Restricted access exclusively to the program deployer wallet address (defined in `.env`) and introduced a global security context to persist wallet authorization across route navigations.

### File: `app/admin/layout.tsx` (NEW)

| Line Numbers | Feature Added                       | Reason for Addition                                                                                                                                                        |
| :----------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | `AdminLayout` with server-side auth | Centralizes admin security by checking Supabase sessions and roles before rendering. Wraps children in the `AdminGuard` for unified protection across all `/admin` routes. |

### File: `components/admin/AdminGuard.tsx` (NEW/MODIFY)

| Line Numbers | Feature Added                      | Reason for Addition                                                                                                                                                                       |
| :----------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | Wallet-based Access Guard          | Blocks all administrative UI components if the connected Solana wallet does not match the authorized address. Displays a premium "Restricted Access" screen for unauthorized connections. |
| **3, 17**    | `AdminSecurityContext` integration | Consumes global authorization state to prevent re-verification flickers during navigation.                                                                                                |

### File: `context/AdminSecurityContext.tsx` (NEW)

| Line Numbers | Feature Added            | Reason for Addition                                                                                                                                             |
| :----------- | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | Global Security Provider | Monitors the connected wallet and maintains an `isAuthorized` flag at the root level, ensuring the connection stays active and verified across all page mounts. |

### File: `app/components/Web3Provider.tsx`

| Line Numbers | Feature Added                     | Reason for Addition                                                                                                          |
| :----------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **5, 25–27** | `AdminSecurityProvider` injection | Initialized the global security context as a root wrapper to ensure state stability across the entire application lifecycle. |

### File: `app/components/SolanaProvider.tsx`

| Line Numbers | Feature Added        | Reason for Addition                                                                                                                          |
| :----------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **31**       | `autoConnect={true}` | Forces the Solana wallet adapter to automatically restore existing connections on mount, streamlining the login flow for repeat admin users. |

### File: `app/admin/page.tsx`

| Line Numbers | Feature Added       | Reason for Addition                                                                                             |
| :----------- | :------------------ | :-------------------------------------------------------------------------------------------------------------- |
| **15**       | Auth simplification | Removed redundant page-level redirect logic as all security checks are now handled by the shared `AdminLayout`. |

---

## Feature: On-Chain Project Edit Integration + Pause/Toggle Controls

**Timestamp:** 2026-04-13T15:27:00+06:00
Wired the `updateProjectParams`, `pauseInvestments`, `pauseTransfers`, and `setProjectActive` on-chain instructions into the admin frontend. Admins can now edit live subscription windows, min/max investment thresholds, lockup dates and distribution cadence directly on a deployed project — all signed by Phantom wallet and confirmed on Solana Devnet before the Supabase record is updated. Pause/resume and transfer-lock toggles are available per card without opening the edit form.

### File: `lib/solana/projectRegistry.ts`

| Line Numbers | Feature Added                                                       | Reason for Addition                                                                                                                                                                                                                                                                                 |
| :----------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **136–150**  | `UpdateProjectParams` interface                                     | Typed contract for the 6 mutable on-chain fields (`minInvestmentUsdc`, `maxInvestmentUsdc`, `subscriptionStart`, `subscriptionEnd`, `distributionCadence`, `lockupEndTs`). All fields are `BN \| null` matching Rust `Option<T>` — `null` = keep current chain value.                               |
| **152–196**  | `updateOnChainProjectParams(connection, wallet, projectId, params)` | Calls the `updateProjectParams` IDL instruction for an already-deployed project. Uses manual `Transaction` assembly with `skipPreflight: true` to avoid Phantom simulation errors. Uses `getLatestBlockhash('finalized')` for a fresh blockhash. Waits for `confirmed` commitment before resolving. |
| **200–230**  | `pauseOnChainInvestments(connection, wallet, projectId, paused)`    | Calls the `pauseInvestments` IDL instruction. `paused=true` blocks new investor subscriptions on-chain; `paused=false` reopens them. Same manual TX pattern as all other instructions.                                                                                                              |
| **234–262**  | `pauseOnChainTransfers(connection, wallet, projectId, paused)`      | Calls the `pauseTransfers` IDL instruction. Freezes SPL token transfer authority when `paused=true`. Used for compliance holds without needing a contract redeployment.                                                                                                                             |
| **266–298**  | `setOnChainProjectActive(connection, wallet, projectId, isActive)`  | Calls the `setProjectActive` IDL instruction (super_admin only on-chain). Sets `is_active` flag; when `false` the project is effectively archived on-chain.                                                                                                                                         |

### File: `components/admin/ProjectsManagement.tsx`

| Line Numbers | Feature Added                                                                                                                       | Reason for Addition                                                                                                                                                                                                                                                                                                                                                                                                 |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **7–13**     | Extended import block — `updateOnChainProjectParams`, `pauseOnChainInvestments`, `pauseOnChainTransfers`, `setOnChainProjectActive` | Required to call the four new chain functions. These are tree-shaken so they add zero bundle weight when the admin isn't using them.                                                                                                                                                                                                                                                                                |
| **110**      | Comment `// Step 1: Blockchain — create NEW or UPDATE existing`                                                                     | Clarifies the bifurcation in `handleSubmit` between create and edit paths.                                                                                                                                                                                                                                                                                                                                          |
| **134–168**  | `else if (editingProject.blockchain_project_id !== null)` branch in `handleSubmit`                                                  | When editing a chain-linked project, builds a `chainUpdateParams` object with only the fields that are non-null in `formData`. If at least one field is populated, calls `updateOnChainProjectParams` before the Supabase `PUT`. If no mutable field changed, the chain call is skipped entirely (no unnecessary transaction fee). Errors from the chain call surface immediately before the DB is touched.         |
| **136**      | `Parameters<typeof updateOnChainProjectParams>[3]` typed object                                                                     | Zero-cast type extraction from the function signature — guarantees the keys accepted by `handleSubmit` match exactly what `updateOnChainProjectParams` accepts, catching mismatches at compile time.                                                                                                                                                                                                                |
| **138–149**  | Individual field guards (`if (formData.min_investment !== undefined...)`)                                                           | Each on-chain field is only included in `chainUpdateParams` if it has a real value. Sending a `0` or empty string would corrupt on-chain data, so every field has an explicit presence check before creating the `BN`.                                                                                                                                                                                              |
| **348–381**  | `handleChainToggle(project, action)` function                                                                                       | Unified handler for all 4 boolean on-chain state changes (`pauseInvestments`, `resumeInvestments`, `pauseTransfers`, `resumeTransfers`). Checks for wallet connection and `blockchain_project_id` before submitting. Reuses `setStatusChanging(project.id)` so the card disables during the in-flight transaction.                                                                                                  |
| **854–877**  | On-chain toggle button group inside card action area                                                                                | Renders `⏸ Pause Inv.` / `▶ Resume Inv.` and `🔒 Pause Tx` mini-buttons for every card where `blockchain_project_id` is not null. Hidden for off-chain-only projects. Uses the same `disabled={statusChanging === project.id}` guard as the status dropdown. Buttons match the existing `text-xs font-medium rounded` aesthetic with color-coded variants (orange for investment pause, yellow for transfer pause). |

---

## Feature: Blank Stats Fix — On-Chain Derived Display Values

**Timestamp:** 2026-04-13T12:48:00+06:00
Fixed blank `Token Price`, `Duration`, and `Token Supply` fields on the user-facing `/projects` cards for projects imported from the blockchain. These three fields don't exist in the on-chain `ProjectAccount` struct so they were `null` in Supabase. Cards now derive display values from available chain data.

### File: `app/projects/page.tsx`

| Line Numbers | Feature Added                                                      | Reason for Addition                                                                                                                                                                    |
| :----------- | :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **131–143**  | `derivedTokenPrice` IIFE                                           | Computes token price as `maxInvestmentUsdc / supplyCap / 1_000_000` USDC. Falls back to on-chain data when DB `token_price` is null or zero. Formats as `$0.0001` for sub-cent prices. |
| **145–152**  | `derivedDuration` IIFE                                             | Computes duration from on-chain subscription window: `(subscriptionEnd - subscriptionStart) / (30 × 86400)` months. Falls back to DB `project_duration_months`.                        |
| **154–160**  | `derivedReturn` IIFE                                               | DB `expected_return_percentage` takes priority. For on-chain projects without a return rate set, displays `"XK tokens"` (supply cap) as a useful substitute instead of showing blank.  |
| **237–244**  | Adaptive stat tile label — `"Token Supply"` vs `"Expected Return"` | When `expected_return_percentage` is null and `isOnChain` is true, the tile header reads "Token Supply" to accurately describe what is displayed, avoiding a misleading label.         |
| **243–249**  | `derivedDuration` wired into Duration tile                         | Replaces the raw `project.project_duration_months` expression which rendered blank for all backfilled chain projects.                                                                  |
| **250–272**  | `derivedTokenPrice` wired into Token Price tile (both branches)    | Replaces `$${project.token_price}` which showed `$1` for the approximate backfill value. Now shows mathematically accurate USDC-per-token from chain state.                            |
| **264–267**  | Null-safe `min_investment` display                                 | `{project.min_investment ? \`$...\` : "—"}` prevents `$undefined`rendering for imported projects that had no`min_investment` set in the DB.                                            |

---

## Feature: On-Chain Project Backfill + Admin RLS Fix on PUT/DELETE

**Timestamp:** 2026-04-13T12:42:00+06:00
Imported all 8 orphaned on-chain projects (IDs 0–7) into Supabase. Fixed missing RLS bypass on UPDATE and DELETE operations in the admin API.

### File: `app/api/admin/projects/[id]/route.ts`

| Line Numbers | Feature Added                                                  | Reason for Addition                                                                                                                                  |
| :----------- | :------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **8**        | Import `createAdminClient`                                     | Applying the same Service Role bypass to UPDATE and DELETE as was already done for INSERT.                                                           |
| **45–47**    | `const adminSupabase = createAdminClient()` before `.update()` | The `projects` table RLS has no `UPDATE` permission for the anon key. Without this, any edit from the admin panel silently returned a `42501` error. |
| **137–139**  | `const adminSupabase = createAdminClient()` before `.delete()` | Same RLS bypass for DELETE. Anon key deletion was being blocked by Postgres silently.                                                                |

### File: `scripts/backfill_onchain_projects.ts` _(NEW)_

| Line Numbers | Feature Added                                 | Reason for Addition                                                                                                                                                                                                                                    |
| :----------- | :-------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | Anchor read-only fetch loop + Supabase upsert | Fetches all on-chain `ProjectAccount`s (IDs 0 to `project_count-1`) from Solana Devnet and inserts them into Supabase `projects` using Service Role key. Previously these existed only on-chain with no DB row, making them invisible to the frontend. |
| **63–78**    | `deriveStatus(account)` function              | Maps on-chain boolean flags (`isActive`, `mintAuthorityRevoked`, `tokensIssued >= supplyCap`, subscription window) to the Supabase status enum. This is the canonical cross-system status mapping.                                                     |
| **38**       | Explicit `any` types on dummy wallet provider | Fixes TypeScript `TS7006` implicit-any error on the read-only AnchorProvider stub used for non-signing chain reads in Node.js.                                                                                                                         |

---

## Feature: Admin Project Rendering Bug Fixes + Quick Status Changer

**Timestamp:** 2026-04-13T12:33:00+06:00
Fixed a `TypeError` crash on `/admin/projects` caused by calling `.toLocaleString()` and arithmetic on null DB fields. Added an inline status dropdown on every project card so admins can change status instantly without opening the full edit form.

### File: `components/admin/ProjectsManagement.tsx`

| Line Numbers | Feature Added                                                                | Reason for Addition                                                                                                                                                                                      |
| :----------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **25**       | `const [statusChanging, setStatusChanging] = useState<string \| null>(null)` | Tracks which card's status dropdown is mid-request so only that dropdown is disabled, allowing the rest of the list to remain interactive during a status update.                                        |
| **283–309**  | `handleStatusChange(projectId, newStatus)` function                          | Fires `PUT /api/admin/projects/[id]` with `{ status: newStatus }` and applies an optimistic update immediately. Realtime subscription confirms from Postgres. Skips opening the full edit form entirely. |
| **730**      | `(project.current_funding ?? 0)` and `(project.funding_goal ?? 0)`           | Fixed `TypeError` crash — Supabase returns `null` for numeric fields that the backfill script left unset. `?? 0` prevents division-by-null at runtime.                                                   |
| **737**      | `(project.available_tokens ?? 0).toLocaleString()`                           | `.toLocaleString()` on `null` throws at runtime. Nullish coalescing converts null to 0 before the call.                                                                                                  |
| **737**      | `(project.total_tokens ?? 0).toLocaleString()`                               | Same fix as above for the corresponding field.                                                                                                                                                           |
| **742**      | `{project.expected_return_percentage ?? '—'}%`                               | Prevents the string `"null%"` rendering in the return tile for projects without this value set.                                                                                                          |
| **747**      | `{project.project_duration_months ?? '—'} months`                            | Prevents `"null months"` rendering in the duration tile.                                                                                                                                                 |
| **757–784**  | Status `<select>` dropdown + grouped Edit/Delete buttons                     | Replaces the flat two-button row with a vertical stack: a status `<select>` on top and the Edit/Delete buttons below. All 6 statuses are available directly from the list view.                          |
| **755–761**  | `⛓ On-Chain` badge with Solana Explorer transaction link                     | Shows a truncated clickable `blockchain_signature` linking to `explorer.solana.com` on cards that have a confirmed on-chain transaction, giving the admin a direct audit trail.                          |

---

## Feature: Blockchain Transaction Duplicate Fix + RLS Bypass Architecture

**Timestamp:** 2026-04-13T10:08:00+06:00
Resolved persistent "Transaction already processed" Phantom simulation errors and fixed Supabase Row-Level Security blocking all project database writes.

### File: `lib/solana/projectRegistry.ts`

| Line Numbers | Feature Added                                        | Reason for Addition                                                                                                                                                                              |
| :----------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **95–126**   | Replaced `.rpc()` with manual `Transaction` assembly | Anchor's `.rpc()` internally reuses blockhashes causing Phantom to pre-simulate duplicate transactions. Manual assembly with `skipPreflight: true` bypasses Phantom's ghost simulation entirely. |
| **106**      | Force `getLatestBlockhash('finalized')`              | Forces the RPC to return an absolutely fresh blockhash from the finalized ledger, bypassing Next.js HTTP cache layers.                                                                           |
| **128–132**  | Returns `{ signature, projectId, projectPda }`       | Exposes the on-chain result so the caller can persist the blockchain linkage into the Supabase database.                                                                                         |

### File: `components/admin/ProjectsManagement.tsx`

| Line Numbers | Feature Added                                         | Reason for Addition                                                                                                                                          |
| :----------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **99**       | `if (loading) return;` guard at top of `handleSubmit` | Prevents React's event system from enqueuing two concurrent transaction-generation calls when the user double-clicks the submit button before Phantom opens. |

### File: `lib/supabase/server.ts`

| Line Numbers | Feature Added                                                              | Reason for Addition                                                                                                                                                                                                                             |
| :----------- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3**        | Import `createClient as createSupabaseClient` from `@supabase/supabase-js` | Required for the Service Role client which uses the raw JS SDK rather than the SSR cookie-aware wrapper.                                                                                                                                        |
| **29–48**    | New export `createAdminClient()`                                           | Creates a Supabase client authenticated with `SUPABASE_SERVICE_ROLE_KEY`. This bypasses all Postgres Row-Level Security policies on tables, allowing server-side admin API routes to perform privileged writes that would otherwise be blocked. |

### File: `app/api/admin/projects/route.ts`

| Line Numbers | Feature Added                                                    | Reason for Addition                                                                                                                                     |
| :----------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **8**        | Import `createAdminClient`                                       | Required to call the privileged client in the POST handler.                                                                                             |
| **31**       | `const adminSupabase = createAdminClient()`                      | Elevated client instance — used for the INSERT so Postgres doesn't block with `42501 violates row-level security`.                                      |
| **34**       | Switch `.from('projects')` to `adminSupabase`                    | The root cause of the `new row violates row-level security policy` error. The anon-key client had no allowed INSERT policy on `projects`.               |
| **57–58**    | `blockchain_signature`, `blockchain_project_id` fields in INSERT | Persists the Solana transaction signature and sequential project ID for later use by the public API to derive the on-chain PDA and fetch enriched data. |

### File: `app/api/admin/projects/[id]/route.ts`

| Line Numbers | Feature Added              | Reason for Addition                                                     |
| :----------- | :------------------------- | :---------------------------------------------------------------------- |
| **8**        | Import `createAdminClient` | Required to apply privileged client to UPDATE/DELETE.                   |
| **45–47**    | `adminSupabase` for PUT    | Same RLS bypass applied to UPDATE so project edits don't fail silently. |
| **137–139**  | `adminSupabase` for DELETE | Same RLS bypass applied to DELETE so project removals don't fail.       |

### File: `app/components/SolanaProvider.tsx`

| Line Numbers | Feature Added                                                        | Reason for Addition                                                                                                                                                  |
| :----------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **24–31**    | `config={{ commitment: 'confirmed', fetch: ... cache: 'no-store' }}` | Forces all underlying `@solana/web3.js` RPC HTTP calls to bypass Next.js's aggressive route-level fetch cache, ensuring blockhash and account state are always live. |

---

## Feature: Hybrid Realtime Projects Page (Supabase + On-Chain)

**Timestamp:** 2026-04-13T12:12:00+06:00
Replaced static hardcoded arrays on the public and admin projects pages with live hybrid data (Supabase metadata + Solana on-chain state). Added Supabase Realtime subscriptions to both pages for zero-refresh live updates.

### File: `lib/types/database.types.ts`

| Line Numbers | Feature Added                                                 | Reason for Addition                                                                        |
| :----------- | :------------------------------------------------------------ | :----------------------------------------------------------------------------------------- |
| **110–111**  | `blockchain_signature`, `blockchain_project_id` in `Row` type | Reflects new columns added to Postgres via migration `008_add_blockchain_to_projects.sql`. |
| **139–140**  | Same fields in `Insert` type                                  | Allows the admin API route to include these fields in TypeScript-safe insert payloads.     |
| **167–168**  | Same fields in `Update` type                                  | Allows future edit operations to update blockchain linkage if needed.                      |

### File: `lib/solana/getProjectAccount.ts` _(NEW)_

| Line Numbers | Feature Added                          | Reason for Addition                                                                                                                                                                                                                                             |
| :----------- | :------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | `getProjectAccount(projectId)`         | Server-side read-only Anchor utility. Derives the PDA from a numeric project ID and fetches the full `ProjectAccount` from Solana Devnet without requiring a browser wallet. Returns `null` gracefully on failure so missing chain data never crashes the page. |
| **All New**  | `getProjectAccountsBulk(projectIds[])` | Wraps `getProjectAccount` in `Promise.allSettled` to fetch multiple accounts in parallel. Per-project failures are swallowed so one bad chain account can't block the entire page response.                                                                     |

### File: `app/api/projects/route.ts` _(NEW)_

| Line Numbers | Feature Added              | Reason for Addition                                                                                                                                                                                                           |
| :----------- | :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | Public `GET /api/projects` | Fetches all public projects from Supabase, enriches them with live on-chain data via `getProjectAccountsBulk`, and returns a merged JSON array. `force-dynamic` export prevents Next.js from caching the response statically. |

### File: `app/projects/page.tsx`

| Line Numbers       | Feature Added                                              | Reason for Addition                                                                                                                                                                                                                               |
| :----------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1–All**          | Full rewrite from static to live hybrid data               | Replaced the hardcoded 6-project array with `fetch('/api/projects')` on mount, `useEffect` Supabase Realtime channel subscription that re-fetches on any DB change, and a `ProjectCard` component that renders both Supabase and on-chain fields. |
| **`ProjectCard`**  | On-chain progress bar (`tokensIssued / supplyCap`)         | Uses the live on-chain counter instead of the static DB `current_funding` field, giving investors a real-time view of token issuance.                                                                                                             |
| **`ProjectCard`**  | ⛓ On-Chain badge, Paused warning, Token Mint explorer link | Visual indicators show chain-verified status, compliance pause flags, and let users click through to Solana Explorer for the token mint and transaction.                                                                                          |
| **`SkeletonCard`** | Loading skeleton component                                 | Renders 3 animated placeholder cards while the API fetches data, preventing layout shift.                                                                                                                                                         |

### File: `components/admin/ProjectsManagement.tsx`

| Line Numbers | Feature Added                                  | Reason for Addition                                                                                                                                                                    |
| :----------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3**        | Import `useEffect`, `createClient`             | Required for realtime subscription lifecycle.                                                                                                                                          |
| **126–129**  | Capture `chainResult` and attach to `formData` | After the blockchain confirms, the Solana signature and project ID are attached to the POST body so `route.ts` can persist them as `blockchain_signature` and `blockchain_project_id`. |
| **165–189**  | Supabase Realtime `useEffect` subscription     | Listens to `postgres_changes` on the `projects` table. INSERT events prepend to state, UPDATE events patch in-place, DELETE events filter out — all without a page refresh.            |
| **286–304**  | Animated "● Live" green dot indicator          | Visual feedback showing the admin that realtime is actively connected, using a CSS `animate-ping` pulsing dot.                                                                         |

---

## Feature: On-Chain Compatibility for Project Creation

**Timestamp:** 2026-04-12T16:30:00+06:00
Integrated required blockchain smart contract parameters directly into the admin visual workflow without breaking existing UI logic.

### File: `components/admin/ProjectsManagement.tsx`

| Line Numbers  | Feature Added                                  | Reason for Addition                                                                                                                                                                                                                                                                                    |
| :------------ | :--------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **22 - 29**   | Extended `setFormData` interface type          | TypeScript would reject the 6 new fields since they do not exist in the default Supabase `ProjectInsert` database schema. Extending the type securely allows tracking temporary UI state for these specific fields.                                                                                    |
| **38 - 44**   | Added Default Values to Form State             | Prevents React "uncontrolled input" warnings and seamlessly auto-fills the `.env` settings (`NEXT_PUBLIC_USDC_MINT` and `NEXT_PUBLIC_ADMIN_WALLET`) so the admin doesn't have to repeatedly type them.                                                                                                 |
| **53 - 54**   | Added `distribution_cadence` to numeric parser | The `handleInputChange` function forces certain fields to be parsed as numbers instead of strings. Added `distribution_cadence` to ensure the Dropdown (0/1/2/3) translates to the strict `u32` integer expected by the smart contract.                                                                |
| **138 - 143** | Reset Values inside `handleEdit()`             | When opening an existing project to edit, we must populate or reset these 6 temporary fields from state so old or undefined data does not leak into the form across different projects.                                                                                                                |
| **188 - 193** | Reset Values inside `resetForm()`              | Ensures that when the "Cancel" or "+ Add New Project" button is clicked, all custom variables zero out and the defaults (like Admin Wallet) repopulate immediately.                                                                                                                                    |
| **386 - 508** | New UI Field Grid Elements                     | Inserted the actual HTML/Tailwind input fields for _Token Symbol_, _Accepted Stablecoin_, _Treasury Wallet_, _Metadata URL_, _Lock-up End Date_, and _Distribution Cadence_. Structured securely inside native Grid rows to perfectly respect the original design without breaking layout constraints. |
| **419**       | Fixed unclosed `</div>` container              | Corrected a trailing HTML container that failed to close properly around the _Available Tokens_ layout block, which triggered a build failure block across the Turbopack engine.                                                                                                                       |

## Feature: EVM to Solana Wallet Migration

**Timestamp:** 2026-04-12T16:42:00+06:00
Replaced Ethereum/Polygon specific wallet logic (RainbowKit/Wagmi) with Solana Wallet Adapter for Phantom and Solflare compatibility, while preserving all existing UI styling.

### File: `app/components/SolanaProvider.tsx`

| Line Numbers | Feature Added            | Reason for Addition                                                                                                                                         |
| :----------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | Created `SolanaProvider` | Initialized Solana's `ConnectionProvider`, `WalletProvider`, and `WalletModalProvider` targeting `devnet` to handle the foundational Solana wallet context. |

### File: `app/components/Web3Provider.tsx`

| Line Numbers    | Feature Added               | Reason for Addition                                                                                                             |
| :-------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **6-11, 23-34** | Commented Out EVM Providers | Disabled Wagmi and RainbowKit globally so EVM configurations stop clashing with Solana without destructively deleting the code. |
| **4, 18-20**    | Injected `SolanaProvider`   | Wrapped the global React tree with the newly created Solana context to make wallet state universally accessible.                |

### File: `hooks/useWalletStatus.ts`

| Line Numbers   | Feature Added               | Reason for Addition                                                                                                                                                     |
| :------------- | :-------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2-5, 30-36** | Swapped Hooks               | Commented out Wagmi's `useAccount` and replaced it with Solana's `useWallet()`. Extracts `publicKey` instead of an EVM address.                                         |
| **110-117**    | Modified Signature Logic    | Replaced the EVM `signMessageAsync` with Solana's native `signMessage` and used the `bs58` library to securely encode the Uint8Array signature to base58 string format. |
| **123, 124**   | Maintained Case Sensitivity | Removed `.toLowerCase()` from the address payload before saving to Supabase, because Solana base58 addresses are case-sensitive (unlike Ethereum hex strings).          |

### UI Wallet Components (`WalletConnection.tsx`, etc)

| Line Numbers  | Feature Added              | Reason for Addition                                                                                                                                                               |
| :------------ | :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(Various)** | Replaced `ConnectButton`   | Swapped RainbowKit's `<ConnectButton />` with Solana's `<WalletMultiButton />` across the main wallet onboarding panel, banner, and dialog modal.                                 |
| **(Inline)**  | Tailwind Utility Overrides | Statically forced Navy/Gold styling classes (`!bg-gradient-to-r !from-gold !to-gold-light`) with strict `!important` tags to override the default purple Phantom styles directly. |

## Feature: Admin Dashboard Wallet Integration

**Timestamp:** 2026-04-12T16:45:00+06:00
Added a quick-access Wallet Connect button natively into the Admin interface headers.

### File: `components/admin/AdminWalletButton.tsx`

| Line Numbers | Feature Added          | Reason for Addition                                                                                                                                                                                    |
| :----------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All New**  | Created Client Wrapper | Encapsulated the `WalletMultiButton` and link logic into an independent `"use client"` component so it could securely render inside the async Server-rendered Admin pages without compilation crashes. |

### Files: `app/admin/page.tsx` & `app/admin/projects/page.tsx`

| Line Numbers        | Feature Added             | Reason for Addition                                                                                                                                                           |
| :------------------ | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(Header blocks)** | Inserted Button Component | Displayed the `<AdminWalletButton />` structurally aligned to the top-right flexbox rows so the admin can link their Supabase identity directly while viewing projects/stats. |

## Feature: Phased Token Launch - Phase 2 (Compliance Integration & IDL Sync)

**Timestamp:** 2026-04-22T09:35:54+06:00
Synchronized the `compliance_transfer` program with the new registry lifecycle and established a robust infrastructure for IDL auditability.

### File: `programs/compliance_transfer/src/compliance_logic/subscribe_investment.rs`

| Line Numbers | Feature Added            | Reason for Addition                                                                                                                                  |
| :----------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **80-85**    | Phased Status Validation | Replaced the stale `is_active` check with a strict `ProjectStatus::Funding` requirement to ensure investments only happen during the correct window. |

### File: `programs/compliance_transfer/src/compliance_logic/finalize_subscription.rs`

| Line Numbers | Feature Added                | Reason for Addition                                                                                                                                                                 |
| :----------- | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1-178**    | Direct-to-Wallet Minting CPI | Refactored to perform a Cross-Program Invocation (CPI) into `project_registry::issue_tokens`. Tokens are now minted and delivered to investors automatically upon admin settlement. |
| **87-99**    | Dynamic Discriminator        | Implemented runtime sha256 computation for the `issue_tokens` instruction discriminator, removing the fragility of hard-coded magic bytes.                                          |

### File: `package.json`

| Line Numbers | Feature Added         | Reason for Addition                                                                                                                          |
| :----------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **15-17**    | IDL Patching Pipeline | Added `patch-idl` and `sync-idl` scripts to automate the flow of patching manual types into generated IDLs and syncing them to the frontend. |

### File: `scripts/patch-idl.ts` & `scripts/idl-patch/compliance_transfer.patch.json`

| Line Numbers | Feature Added      | Reason for Addition                                                                                                                                                                   |
| :----------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **All New**  | IDL Infrastructure | Created a dedicated pipeline to maintain types that Anchor macros don't auto-generate (like foreign mirror structs), ensuring "Solscan Explorer" decoder rings remain fully detailed. |

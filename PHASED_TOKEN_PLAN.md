# AURUMCHAIN Phased Token & Direct Delivery Plan (Confirmed)

This plan implements on-chain phase enforcement, formal status management, and **Direct-to-Wallet** token delivery as confirmed by the client.

## 1. Zero-Trust Security: Program-Controlled Minting
To fulfill the "strictly controlled" requirement, the **Project Registry Program** will be the Mint Authority (via a PDA).
*   **No Single Key**: No admin or external party can mint tokens without passing the on-chain status and round limit checks.
*   **Logic Enforcement**: Tokens can only be created if the project is in a valid phase (e.g., Funding) and within the defined round cap.

## 2. Direct-to-Investor Delivery Model
Per client preference, tokens will be minted **directly to the investor's wallet** upon settlement, rather than sitting in a treasury.

### The Atomic Settlement Flow:
1.  **Investment Subscribed**: Investor commits funds (Subscription is `Pending`).
2.  **Admin Settlement**: Admin verifies payment off-chain and calls `finalize_subscription` in the **Compliance Program**.
3.  **Atomic Mint**: 
    - `compliance_transfer` verifies the settlement.
    - `compliance_transfer` performs a CPI (Cross-Program Invocation) to `project_registry`.
    - `project_registry` performs a CPI to the **Token Program** to mint tokens.

## 3. Project Lifecycle & Asset Models
We use a **Unified Engine** that is "Phase-Agile" but "Asset-Neutral." The system separates the **Lifecycle Phase** from the **Pause Switch** for maximum control.

### Phase vs. State (The "Emergency Brake"):
A project is controlled by two independent flags. This ensures you never "lose your place" if you need to pause operations.
- **ProjectStatus**: The lifecycle phase (e.g., Funding, Active).
- **is_paused**: The operational switch. If `True`, all actions are blocked *but the phase remains the same*.
- **Result**: Pausing a `Funding` project does NOT cancel it; it simply freezes it until resumed.

### Asset Logic Table:
| Asset Label | On-Chain Logic (Round Limit) | Behavior |
| :--- | :--- | :--- |
| **Real Estate** | **100% (Default)** | Full supply minted upfront. Fixed and predictable. |
| **Mining** | **Variable (e.g. 10%)** | Phased rollout based on funding rounds. |
| **Future Types** | **Custom** | System remains open for any new distribution model. |

## 4. Transparency & Auditing (On-Chain)
To ensure the system is "clear and auditable" for investors, we implement the following:
*   **Decoder Ring (IDL)**: We will upload the Program IDL to the blockchain. This translates raw code into **human-readable headings** on Solana Explorer (Solscan).
*   **Plain English Status**: Investors will see clear labels like `Status: Funding` and `Is Paused: False` rather than raw numbers.
*   **Transaction Trail**: Every mint will explicitly show that the **Registry Program** (the Smart Contract) was the authority that authorized the tokens.

## 5. Implementation Details

### Project Registry Upgrades:
- **`issue_tokens`**: A new instruction authorized ONLY for the Compliance Program or Super Admin.
- **`AssetType` Label**: A metadata field used by the Dashboard to apply UI presets.
- **`Round Tracking`**: `round_limit_tokens` and `current_round_issued` fields.

### Compliance Program Upgrades:
- **`finalize_subscription` Integration**: Updated to trigger the registry's minting logic during settlement.

## 6. Migration Strategy (Projects 0-28)
*   **Security Upgrade**: Transfer Mint Authority to the Registry PDA.
*   **Status Mapping**: 
    - `is_active: true` -> `ProjectStatus::Funding`
    - `is_active: false` -> `ProjectStatus::Canceled`.

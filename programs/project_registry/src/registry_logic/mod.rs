mod initialize_control;
mod create_project;
mod update_project_status;
mod set_project_mint;
mod revoke_mint_authority;
mod update_project_params;
mod record_tokens_issued;
mod transfer_authority;
mod set_emergency_pause;
mod calibrate_registry;
mod issue_tokens;   // Step 1.5 — SPL mint_to CPI
mod reset_round;    // Step 1.7 — round counter reset

// Permanent Modular Fix: Pull all types (including hidden Anchor types)
// into the registry_logic namespace using glob re-exports.
// These will no longer collide because we have unique handler names.
pub use initialize_control::*;
pub use create_project::*;
pub use update_project_status::*;
pub use set_project_mint::*;
pub use revoke_mint_authority::*;
pub use update_project_params::*;
pub use record_tokens_issued::*;
pub use transfer_authority::*;
pub use set_emergency_pause::*;
pub use calibrate_registry::*;
pub use issue_tokens::*;
pub use reset_round::*;

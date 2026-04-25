import { PublicKey } from '@solana/web3.js';

/**
 * Centralized Program ID Configuration
 * 
 * Moving these to a dedicated file ensures consistency across the frontend, 
 * backend services, and automated scripts.
 */

// Project Registry Program ID
export const PROJECT_REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID || 
  'Dkrnk6B8MuiieXQzqhicbsPtGp7TY4HMZRNDJJFhu4R7'
);

// Compliance / Transfer Control Program ID
export const COMPLIANCE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID || 
  '5u14TuRE7ozsKketfqF4R7XPvi7bof9RA455VcKME3Vy'
);

// Metaplex Metadata Program ID (Constant)
export const METAPLEX_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

// Allocation & Distribution Program ID
export const ALLOCATION_DISTRIBUTION_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ALLOCATION_DISTRIBUTION_PROGRAM_ID || 
  '9RqVyvWA4ficqK351PoYh674mP1au4NmNzVM6LQcenjm'
);

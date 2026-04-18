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
  'GcXxLjcCm7ov3i6QqQsL8zgjqiknWBswXn6jcwpEMYdC'
);

// Compliance / Transfer Control Program ID
export const COMPLIANCE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID || 
  '9q8aRmc8sVf5n9s8aRmc8sVf5n9s8aRmc8sVf5n9s8aR' // Placeholder until US 2.4 deployment
);

// Metaplex Metadata Program ID (Constant)
export const METAPLEX_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

/**
 * PDA Helper Utilities for Aurumchain Programs
 */

/**
 * Derives the PDA for the global registry config account.
 * Seeds: [b"registry"]
 */
export function getRegistryPDA(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('registry')],
    programId
  )[0];
}

/**
 * Derives the project PDA from a numeric project ID.
 * Seeds: [b"project", project_id (u64 le)]
 */
export function getProjectPDA(projectId: number | BN, programId: PublicKey): PublicKey {
  const idBN = typeof projectId === 'number' ? new BN(projectId) : projectId;
  return PublicKey.findProgramAddressSync(
    [Buffer.from('project'), idBN.toArrayLike(Buffer, 'le', 8)],
    programId
  )[0];
}

/**
 * Derives the Metaplex Metadata PDA for a specific Token Mint.
 * Seeds: [b"metadata", metadata_program_id, mint_pubkey]
 */
export function getMetadataPDA(mint: PublicKey): PublicKey {
  const METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  )[0];
}

/**
 * Derives the Control Account PDA (for authority management).
 * Seeds: [b"control"]
 * Note: Currently this is often synonymous with the RegistryConfig in some contexts, 
 * but specified here for future compliance separation.
 */
export function getControlPDA(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('control')],
    programId
  )[0];
}

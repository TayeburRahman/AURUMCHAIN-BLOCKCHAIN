import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

/**
 * PDA Helper Utilities for Aurumchain Programs
 */

/**
 * Derives the PDA for the global registry config account.
 * Seeds: [b"control"]
 */
export function getRegistryPDA(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('control')],
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
 */
export function getControlPDA(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('control')],
    programId
  )[0];
}

/**
 * Derives the Mint Authority PDA for a project.
 * This PDA is the actual authority on the SPL Token Mint.
 * Seeds: ["mint_authority", project_id (u64 le)]
 */
export function getMintAuthorityPDA(projectId: number | BN, programId: PublicKey): PublicKey {
  const idBN = typeof projectId === 'number' ? new BN(projectId) : projectId;
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('mint_authority'),
      idBN.toArrayLike(Buffer, 'le', 8),
    ],
    programId
  )[0];
}

/**
 * Derives the Compliance Control PDA for Program 2.
 * Seeds: [b"compliance_control"]
 */
export function getComplianceControlPDA(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('compliance_control')],
    programId
  )[0];
}

/**
 * Derives the Investor Eligibility PDA.
 * Seeds: [b"eligibility", wallet_pubkey]
 */
export function getEligibilityPDA(wallet: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('eligibility'), wallet.toBuffer()],
    programId
  )[0];
}

/**
 * Derives the Investment Subscription PDA.
 * Seeds: [b"subscription", investor_pubkey, subscription_id (u64 le)]
 */
export function getSubscriptionPDA(investor: PublicKey, subscriptionId: number | BN, programId: PublicKey): PublicKey {
  const subIdBN = typeof subscriptionId === 'number' ? new BN(subscriptionId) : subscriptionId;
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('subscription'),
      investor.toBuffer(),
      subIdBN.toArrayLike(Buffer, 'le', 8)
    ],
    programId
  )[0];
}

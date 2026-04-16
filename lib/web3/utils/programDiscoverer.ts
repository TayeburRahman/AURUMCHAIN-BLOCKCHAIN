import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import idl from '@/programs/project_registry/src/idl.json';
import complianceIdl from '@/programs/compliance_transfer/src/idl.json';

/**
 * Program Discovery Utilities
 * 
 * Centralized location for Program IDs and factory functions to ensure 
 * consistent instantiation across the application.
 */

export const PROJECT_REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID || 
  'GcXxLjcCm7ov3i6QqQsL8zgjqiknWBswXn6jcwpEMYdC'
);

export const COMPLIANCE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID ||
  'CHWFf4LBaq3VECZ6hiH4YZWNrqezkDteiDq1VbYLFtTs'
);

/**
 * Factory to create an Anchor Program instance for the Project Registry.
 * 
 * @param connection - Solana RPC connection.
 * @param wallet - Optional wallet adapter. If null, a read-only mock is used.
 * @returns {Program} Specialized Anchor Program instance.
 */
export const getRegistryProgram = (connection: Connection, wallet?: any) => {
  const readOnlyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  };

  const provider = new AnchorProvider(
    connection,
    wallet || readOnlyWallet,
    AnchorProvider.defaultOptions()
  );
  setProvider(provider);
  
  return new Program(idl as any, PROJECT_REGISTRY_PROGRAM_ID, provider);
};

/**
 * Factory to create an Anchor Program instance for Compliance Transfer.
 */
export const getComplianceProgram = (connection: Connection, wallet?: any) => {
  const readOnlyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  };

  const provider = new AnchorProvider(
    connection,
    wallet || readOnlyWallet,
    AnchorProvider.defaultOptions()
  );
  
  return new Program(complianceIdl as any, COMPLIANCE_PROGRAM_ID, provider);
};

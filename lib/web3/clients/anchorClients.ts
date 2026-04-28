import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';

// Directly import JSON IDLs
import projectRegistryIdl from '../idl/project_registry.json';
import complianceTransferIdl from '../idl/compliance_transfer.json';
import distributionIdl from '../idl/allocation_distribution.json';

import { PROJECT_REGISTRY_PROGRAM_ID, COMPLIANCE_PROGRAM_ID, ALLOCATION_DISTRIBUTION_PROGRAM_ID } from '../config/programs';

/**
 * Anchor Client Factories
 * 
 * Centralized instantiation of typed Anchor Program clients using 
 * the synced JSON IDL files.
 */

const getProvider = (connection: Connection, wallet?: any) => {
  const mockWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  };

  return new AnchorProvider(
    connection,
    wallet || mockWallet,
    AnchorProvider.defaultOptions()
  );
};

/**
 * Returns a typed instance of the Project Registry program.
 */
export const getRegistryProgram = (connection: Connection, wallet?: any) => {
  const provider = getProvider(connection, wallet);
  return new Program(projectRegistryIdl as Idl, PROJECT_REGISTRY_PROGRAM_ID, provider);
};

/**
 * Returns a typed instance of the Compliance & Transfer Control program.
 */
export const getComplianceProgram = (connection: Connection, wallet?: any) => {
  const provider = getProvider(connection, wallet);
  return new Program(complianceTransferIdl as Idl, COMPLIANCE_PROGRAM_ID, provider);
};

/**
 * Returns a typed instance of the Allocation & Distribution program.
 */
export const getDistributionProgram = (connection: Connection, wallet?: any) => {
  const provider = getProvider(connection, wallet);
  return new Program(distributionIdl as Idl, ALLOCATION_DISTRIBUTION_PROGRAM_ID, provider);
};

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { ProjectRegistryRepository } from '../repositories/projectRegistryRepository';
import { getRegistryProgram } from '../../solana/projectRegistry';

/**
 * ProjectRegistryService
 * 
 * High-level service for Project Registry operations.
 * Orchestrates transaction construction and robust RPC execution with custom error parsing.
 * Follows the Service-Repository design pattern for Web3 integration.
 */
export class ProjectRegistryService {
  private repository: ProjectRegistryRepository;
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
    // Uses existing program factory to maintain IDL consistency
    const program = getRegistryProgram(connection, wallet);
    this.repository = new ProjectRegistryRepository(program);
  }

  /**
   * Transfers registry authority (Super Admin and/or Operational Authority).
   * 
   * SECURITY: Restricted to current super_admin as listed in ControlAccount.
   * Requires signatures from BOTH current super_admin and current authority.
   * 
   * @param params - Object containing the optional new public keys.
   * @param params.newSuperAdmin - New master admin public key.
   * @param params.newAuthority - New operational admin public key.
   * @returns {Promise<string>} The confirmed transaction signature.
   * @throws {Error} Branded error with parsed Solana logs if the transaction fails.
   */
  async transferAuthority(params: {
    newSuperAdmin?: PublicKey | null;
    newAuthority?: PublicKey | null;
  }): Promise<string> {
    try {
      if (!this.wallet.publicKey) {
        throw new Error("AUTHENTICATION_ERROR: Wallet not connected");
      }

      // 1. Fetch current on-chain state to identify required signers
      const registryConfig = await this.repository.fetchRegistryConfig();
      
      // 2. Build the atomic instruction via the repository
      const instruction = await this.repository.getTransferAuthorityInstruction(
        registryConfig.superAdmin,
        registryConfig.authority,
        params.newSuperAdmin ?? null,
        params.newAuthority ?? null
      );

      // 3. Construct and prepare the transaction with a fresh blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      // 4. Atomic execution and confirmation
      // Note: If current superAdmin and authority are distinct wallets, 
      // both must be present in the signing process.
      const signature = await this.wallet.sendTransaction(transaction, this.connection, {
        skipPreflight: true,
        maxRetries: 3
      });

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      return signature;
    } catch (error: any) {
      console.error("ProjectRegistryService.transferAuthority critical failure:", error);
      
      // Robust error parsing specifically for Solana RPC error logs
      if (error.logs) {
        const programError = this.parseProgramError(error.logs);
        throw new Error(`BLOCKCHAIN_ERROR: ${programError}`);
      }
      
      throw error;
    }
  }

  /**
   * Internal helper to extract descriptive error codes from Solana logs.
   * Prevents generic "Transaction failed" messages by surfacing program context.
   */
  private parseProgramError(logs: string[]): string {
    const errorPattern = /custom program error: (0x[0-9a-fA-F]+)/;
    for (const log of logs) {
      const match = log.match(errorPattern);
      if (match) {
        return `Custom Program Error ${match[1]} - Check IDL for description.`;
      }
      if (log.includes("Error: ")) return log;
    }
    return "Unknown Transaction Error";
  }

  /**
   * Synchronizes the local application state with authoritative on-chain registry metadata.
   * 
   * @returns {Promise<any>} The current registry configuration.
   */
  async syncRegistryState(): Promise<any> {
    return await this.repository.fetchRegistryConfig();
  }
}

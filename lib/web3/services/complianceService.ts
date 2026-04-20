import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { ComplianceRepository } from '../repositories/complianceRepository';
import { getComplianceProgram } from '../utils/programDiscoverer';
import { RecordVerifiedWalletSchema, RevokeWalletSchema } from '../schemas/compliance';
import { confirmTransactionRobustly } from '../utils/transactionUtils';

/**
 * ComplianceTransferService
 * 
 * High-level service for Investor Eligibility operations.
 * Handles on-chain transaction construction and execution.
 * 
 * NOTE: Database synchronization is handled via Server Actions to comply with 
 * Next.js architectural boundaries and security standards.
 */
export class ComplianceService {
  private repository: ComplianceRepository;
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
    const program = getComplianceProgram(connection, wallet);
    this.repository = new ComplianceRepository(program);
  }

  /**
   * Standardized Response Format for Service
   */
  private formatResponse(success: boolean, data: any = null, error: string | null = null) {
    return { success, data, error };
  }

  /**
   * PREPARES and SENDS the record_verified_wallet transaction.
   */
  async recordVerifiedWallet(input: any) {
    try {
      if (!this.wallet.publicKey) throw new Error("UNAUTHORIZED: Wallet not connected");

      // Strict Input Validation
      const validated = RecordVerifiedWalletSchema.parse(input);

      // Prepare Blockchain Instruction
      const walletPubkey = new PublicKey(validated.wallet);
      
      // Map Numbers to Anchor Enum Objects
      const anchorKycStatus = mapKycStatusToAnchor(validated.kycStatus);
      const anchorAmlStatus = mapAmlStatusToAnchor(validated.amlStatus);

      const instruction = await this.repository.getRecordVerifiedWalletInstruction(
        walletPubkey,
        {
          kycStatus: anchorKycStatus,
          amlStatus: anchorAmlStatus,
          identityHash: validated.identityHash,
          investmentAllowed: validated.investmentAllowed,
          transferAllowed: validated.transferAllowed,
          expiryTimestamp: new BN(validated.expiryTimestamp),
        }
      );

      // Send & Confirm Transaction
      const signature = await this.sendAndConfirm(instruction);

      return this.formatResponse(true, { signature, status: 'approved' });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * PREPARES and SENDS the revoke_wallet transaction.
   */
  async revokeWallet(input: any) {
    try {
      if (!this.wallet.publicKey) throw new Error("UNAUTHORIZED: Wallet not connected");

      const validated = RevokeWalletSchema.parse(input);
      const walletPubkey = new PublicKey(validated.wallet);

      const instruction = await this.repository.getRevokeWalletInstruction(walletPubkey);
      const signature = await this.sendAndConfirm(instruction);

      return this.formatResponse(true, { signature, status: 'revoked' });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Internal helper for single-instruction transactions.
   */
  private async sendAndConfirm(instruction: any): Promise<string> {
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
    
    const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 50000, 
    });

    const transaction = new Transaction().add(priorityFeeIx, instruction);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.wallet.publicKey;

    const signature = await this.wallet.sendTransaction(transaction, this.connection, {
      skipPreflight: true,
    });

    await confirmTransactionRobustly(
      this.connection,
      signature,
      lastValidBlockHeight,
      'confirmed'
    );

    return signature;
  }

  private handleError(error: any) {
    console.error("[ComplianceService] Execution Failed:", error);
    let message = error.message || "Internal Server Error";
    
    if (error.name === 'ZodError' && Array.isArray(error.errors)) {
      message = "VALIDATION_ERROR: " + error.errors.map((e: any) => e.message).join(", ");
    }
    
    return this.formatResponse(false, null, message);
  }

  /**
   * VALIDATES a transfer in Simulation-Mode (view-only).
   * 
   * returns { allowed: boolean, reasonCode: number }
   */
  async validateTransfer(params: {
    sender: string,
    receiver: string,
    projectId: number,
    amount: number,
    transfersPaused: boolean,
    lockupEndTs: number
  }) {
    try {
      const instruction = await this.repository.getTransferValidateInstruction(
        new PublicKey(params.sender),
        new PublicKey(params.receiver),
        new BN(params.projectId),
        new BN(params.amount),
        params.transfersPaused,
        new BN(params.lockupEndTs)
      );

      // Construct transaction and Simulate
      const { blockhash } = await this.connection.getLatestBlockhash();
      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey || new PublicKey("11111111111111111111111111111111");

      const simulation = await this.connection.simulateTransaction(transaction);

      // Handle Simulation Errors (e.g. Account Not Found)
      if (simulation.value.err) {
         return this.formatResponse(false, null, `SIMULATION_ERROR: ${JSON.stringify(simulation.value.err)}`);
      }

      // In Anchor, the return value or logs can be used. 
      // For this spec, we rely on the Event emitted or the logical pass/fail.
      // A "Pass" means allowed=true.
      return this.formatResponse(true, { 
        allowed: true, 
        reasonCode: 0 
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }
}

/**
 * Mappers for Anchor Enums
 */
function mapKycStatusToAnchor(status: number) {
  const map: Record<number, any> = {
    0: { pending: {} },
    1: { approved: {} },
    2: { rejected: {} },
    3: { expired: {} }
  };
  return map[status] || { pending: {} };
}

function mapAmlStatusToAnchor(status: number) {
  const map: Record<number, any> = {
    0: { clear: {} },
    1: { flagged: {} },
    2: { blocked: {} }
  };
  return map[status] || { clear: {} };
}

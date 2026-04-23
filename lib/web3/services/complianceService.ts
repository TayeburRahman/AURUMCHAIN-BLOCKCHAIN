import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { ComplianceRepository } from '../repositories/complianceRepository';
import { getComplianceProgram, getRegistryProgram } from '../utils/programDiscoverer';
import { RecordVerifiedWalletSchema, RevokeWalletSchema, SubscribeInvestmentSchema, FinalizeSubscriptionSchema } from '../schemas/compliance';
import { confirmTransactionRobustly } from '../utils/transactionUtils';
import { getSubscriptionPDA, getProjectPDA } from '../utils/pdaHelpers';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PROJECT_REGISTRY_PROGRAM_ID } from '../config/programs';

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
  private program: Program;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
    this.program = getComplianceProgram(connection, wallet);
    this.repository = new ComplianceRepository(this.program);
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

      const { blockhash } = await this.connection.getLatestBlockhash();
      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey || new PublicKey("11111111111111111111111111111111");

      const simulation = await this.connection.simulateTransaction(transaction);

      if (simulation.value.err) {
         return this.formatResponse(false, null, `SIMULATION_ERROR: ${JSON.stringify(simulation.value.err)}`);
      }

      // In a "perfect" implementation, we'd parse the ReturnData or Logs.
      // For Milestone 2, we consider a successful simulation as 'Allowed' 
      // unless the logs contain a specific error string.
      const logs = simulation.value.logs || [];
      const isBlocked = logs.some(log => log.includes("Error") || log.includes("failed"));
      
      return this.formatResponse(true, { 
        allowed: !isBlocked, 
        reasonCode: isBlocked ? 0x99 : 0 
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * PREPARES and SENDS the subscribe_investment transaction.
   */
  async subscribeInvestment(input: any) {
    try {
      if (!this.wallet.publicKey) throw new Error("UNAUTHORIZED: Wallet not connected");

      const validated = SubscribeInvestmentSchema.parse(input);

      const instruction = await this.repository.getSubscribeInvestmentInstruction(
        new BN(validated.subscriptionId),
        validated.projectId,
        new BN(validated.investmentAmount),
        new PublicKey(validated.paymentAsset),
        PROJECT_REGISTRY_PROGRAM_ID
      );

      const signature = await this.sendAndConfirm(instruction);
      return this.formatResponse(true, { signature, status: 'pending' });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * PREPARES and SENDS the finalize_subscription transaction.
   * Resolves all mandatory accounts for the registry CPI internally.
   */
  async finalizeSubscription(input: any) {
    try {
      if (!this.wallet.publicKey) throw new Error("UNAUTHORIZED: Wallet not connected");

      const validated = FinalizeSubscriptionSchema.parse(input);
      const investorPubkey = new PublicKey(validated.investor);
      const subscriptionIdBN = new BN(validated.subscriptionId);

      // 1. Resolve Subscription & Project Metadata for CPI
      const subscriptionPda = getSubscriptionPDA(investorPubkey, subscriptionIdBN, this.program.programId);
      const subscriptionData: any = await this.program.account.investmentSubscriptionAccount.fetch(subscriptionPda);
      const projectId = (subscriptionData.projectId as BN).toNumber();

      const registryProgram = getRegistryProgram(this.connection, this.wallet);
      const projectPda = getProjectPDA(projectId, registryProgram.programId);
      const projectData: any = await registryProgram.account.projectAccount.fetch(projectPda);
      const mint = projectData.mint as PublicKey;

      const investorTokenAccount = getAssociatedTokenAddressSync(mint, investorPubkey);

      // 2. Prepare Instruction via Repository
      const instruction = await this.repository.getFinalizeSubscriptionInstruction(
        investorPubkey,
        subscriptionIdBN,
        validated.txHash,
        new BN(validated.tokenAmount),
        projectId,
        registryProgram.programId,
        mint,
        investorTokenAccount
      );

      const signature = await this.sendAndConfirm(instruction);
      return this.formatResponse(true, { signature, status: 'allocated' });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * PREPARES and SENDS the toggle_lockup_bypass transaction.
   */
  async toggleLockupBypass(investorWallet: string, enabled: boolean) {
    try {
      if (!this.wallet.publicKey) throw new Error("UNAUTHORIZED: Wallet not connected");

      const instruction = await this.repository.getToggleLockupBypassInstruction(
        new PublicKey(investorWallet),
        enabled
      );

      const signature = await this.sendAndConfirm(instruction);
      return this.formatResponse(true, { signature, status: 'updated' });

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

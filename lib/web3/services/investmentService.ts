import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { InvestmentRepository } from '../repositories/investmentRepository';
import { getComplianceProgram, getRegistryProgram } from '../utils/programDiscoverer';
import { confirmTransactionRobustly } from '../utils/transactionUtils';
import { PROJECT_REGISTRY_PROGRAM_ID } from '../config/programs';

/**
 * InvestmentService
 * 
 * High-level service to manage investment subscriptions.
 */
export class InvestmentService {
  private repository: InvestmentRepository;
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
    const program = getComplianceProgram(connection, wallet);
    this.repository = new InvestmentRepository(program, PROJECT_REGISTRY_PROGRAM_ID);
  }

  /**
   * Orchestrates the subscription process.
   */
  async subscribe(params: {
    projectId: number;
    amount: number; // In base units (e.g. 100 for 100 USDC)
    paymentAsset: PublicKey;
  }): Promise<string> {
    try {
      if (!this.wallet.publicKey) throw new Error("Wallet not connected");

      // 1. Fetch Project Data to get Treasury Wallet
      const registryProgram = getRegistryProgram(this.connection, this.wallet);
      const projectIdBN = new BN(params.projectId);
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('project'), projectIdBN.toArrayLike(Buffer, 'le', 8)],
        registryProgram.programId
      );
      const projectData: any = await registryProgram.account.projectAccount.fetch(projectPda);

      // 2. Derive Token Accounts
      const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const investorTokenAccount = getAssociatedTokenAddressSync(params.paymentAsset, this.wallet.publicKey);
      const treasuryTokenAccount = getAssociatedTokenAddressSync(params.paymentAsset, projectData.treasuryWallet);

      const subscriptionId = new BN(Date.now());
      const amountBN = new BN(params.amount).mul(new BN(1_000_000)); // USDC 6 decimals

      const instruction = await this.repository.getSubscribeInvestmentInstruction(
        this.wallet.publicKey,
        {
          subscriptionId,
          projectId: params.projectId,
          amount: amountBN,
          paymentAsset: params.paymentAsset,
          investorTokenAccount,
          treasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      );

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
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetches all subscriptions for the current user.
   */
  async getMySubscriptions(): Promise<any[]> {
    try {
      if (!this.wallet.publicKey) return [];
      return await this.repository.fetchInvestorSubscriptions(this.wallet.publicKey);
    } catch (error) {
      console.error("[InvestmentService] getMySubscriptions error:", error);
      return [];
    }
  }

  private handleError(error: any): Error {
    if (error.logs) {
      console.error("InvestmentService failure logs:", error.logs);
      // Map common compliance errors
      if (error.logs.some((l: string) => l.includes("InvestmentTooLow"))) return new Error("Amount is below the project's minimum investment limit.");
      if (error.logs.some((l: string) => l.includes("InvestmentTooHigh"))) return new Error("Amount exceeds the project's maximum investment limit.");
      if (error.logs.some((l: string) => l.includes("ProjectNotActive"))) return new Error("This project is currently not accepting new investments.");
    }
    return error instanceof Error ? error : new Error(JSON.stringify(error));
  }
}

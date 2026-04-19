import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { InvestmentRepository } from '../repositories/investmentRepository';
import { getComplianceProgram, getRegistryProgram } from '../utils/programDiscoverer';
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

      const subscriptionId = new BN(Date.now());
      const amountBN = new BN(params.amount).mul(new BN(1_000_000)); // USDC 6 decimals

      const instruction = await this.repository.getSubscribeInvestmentInstruction(
        this.wallet.publicKey,
        {
          subscriptionId,
          projectId: params.projectId,
          amount: amountBN,
          paymentAsset: params.paymentAsset,
        }
      );

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      const signature = await this.wallet.sendTransaction(transaction, this.connection, {
        skipPreflight: true,
      });

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

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

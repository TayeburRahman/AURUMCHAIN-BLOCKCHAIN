import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { getSubscriptionPDA, getEligibilityPDA, getComplianceControlPDA, getProjectPDA } from '../utils/pdaHelpers';

/**
 * InvestmentRepository
 * 
 * Handles interaction with the Compliance Transfer program for investment subscriptions.
 */
export class InvestmentRepository {
  private program: Program;
  private registryProgramId: PublicKey;

  constructor(program: Program, registryProgramId: PublicKey) {
    this.program = program;
    this.registryProgramId = registryProgramId;
  }

  /**
   * Constructs the subscribe_investment instruction.
   */
  async getSubscribeInvestmentInstruction(
    investor: PublicKey,
    params: {
      subscriptionId: BN;
      projectId: number;
      amount: BN;
      paymentAsset: PublicKey;
    }
  ): Promise<TransactionInstruction> {
    const projectIdBN = new BN(params.projectId);
    
    return await this.program.methods
      .subscribeInvestment(
        params.subscriptionId,
        projectIdBN,
        params.amount,
        params.paymentAsset
      )
      .accounts({
        subscription: getSubscriptionPDA(investor, params.subscriptionId, this.program.programId),
        investor: investor,
        eligibility: getEligibilityPDA(investor, this.program.programId),
        projectAccount: getProjectPDA(projectIdBN, this.registryProgramId),
        projectRegistryProgram: this.registryProgramId,
        control: getComplianceControlPDA(this.program.programId),
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  /**
   * Constructs the finalize_subscription instruction (Admin action).
   */
  async getFinalizeSubscriptionInstruction(
    investor: PublicKey,
    subscriptionId: BN,
    params: {
      settlementTxHash: number[]; // [u8; 64]
      allocatedTokenAmount: BN;
    }
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .finalizeSubscription(
        Buffer.from(params.settlementTxHash),
        params.allocatedTokenAmount
      )
      .accounts({
        subscription: getSubscriptionPDA(investor, subscriptionId, this.program.programId),
        control: getComplianceControlPDA(this.program.programId),
        authority: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Fetches a specific subscription account.
   */
  async fetchSubscription(investor: PublicKey, subscriptionId: BN): Promise<any> {
    const pda = getSubscriptionPDA(investor, subscriptionId, this.program.programId);
    return await this.program.account.investmentSubscriptionAccount.fetch(pda);
  }

  /**
   * Fetches all subscriptions for a specific investor.
   */
  async fetchInvestorSubscriptions(investor: PublicKey): Promise<any[]> {
    return await this.program.account.investmentSubscriptionAccount.all([
      {
        memcmp: {
          offset: 8 + 8, // Discrim + subscriptionId
          bytes: investor.toBase58(),
        },
      },
    ]);
  }
}

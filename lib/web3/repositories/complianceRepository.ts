import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { getComplianceControlPDA, getEligibilityPDA, getSubscriptionPDA, getProjectPDA } from '../utils/pdaHelpers';

/**
 * ComplianceRepository
 * 
 * Handles raw data access and instruction construction for the Compliance Transfer program.
 */
export class ComplianceRepository {
  private program: Program;

  constructor(program: Program) {
    this.program = program;
  }

  getProgramId(): PublicKey {
    return this.program.programId;
  }

  /**
   * Constructs record_verified_wallet instruction.
   */
  async getRecordVerifiedWalletInstruction(
    wallet: PublicKey,
    params: {
      kycStatus: any;
      amlStatus: any;
      identityHash: number[];
      investmentAllowed: boolean;
      transferAllowed: boolean;
      expiryTimestamp: BN;
    }
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .recordVerifiedWallet(params)
      .accounts({
        eligibility: getEligibilityPDA(wallet, this.program.programId),
        wallet: wallet,
        control: getComplianceControlPDA(this.program.programId),
        authority: this.program.provider.publicKey!,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  /**
   * Constructs refresh_eligibility instruction.
   */
  async getRefreshEligibilityInstruction(
    wallet: PublicKey,
    params: {
      kycStatus: any;
      amlStatus: any;
      identityHash: number[];
      investmentAllowed: boolean;
      transferAllowed: boolean;
      expiryTimestamp: BN;
    }
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .refreshEligibility(params)
      .accounts({
        eligibility: getEligibilityPDA(wallet, this.program.programId),
        control: getComplianceControlPDA(this.program.programId),
        authority: this.program.provider.publicKey!,
      } as any)
      .instruction();
  }

  /**
   * Constructs revoke_wallet instruction.
   */
  async getRevokeWalletInstruction(wallet: PublicKey): Promise<TransactionInstruction> {
    return await this.program.methods
      .revokeWallet()
      .accounts({
        eligibility: getEligibilityPDA(wallet, this.program.programId),
        control: getComplianceControlPDA(this.program.programId),
        authority: this.program.provider.publicKey!,
      } as any)
      .instruction();
  }

  /**
   * Fetches and deserializes an InvestorEligibilityAccount.
   */
  async fetchEligibilityAccount(wallet: PublicKey): Promise<any> {
    const pda = getEligibilityPDA(wallet, this.program.programId);
    return await this.program.account.investorEligibilityAccount.fetch(pda);
  }

  /**
   * Fetches the global ComplianceControl account.
   */
  async fetchComplianceControl(): Promise<any> {
    const pda = getComplianceControlPDA(this.program.programId);
    return await this.program.account.complianceControl.fetch(pda);
  }

  /**
   * Constructs transfer_validate instruction.
   */
  async getTransferValidateInstruction(
    sender:       PublicKey,
    receiver:     PublicKey,
    projectId:    BN,
    amount:       BN,
    transfersPaused: boolean,
    lockupEndTs:     BN
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .transferValidate(projectId, amount, transfersPaused, lockupEndTs)
      .accounts({
        control:            getComplianceControlPDA(this.program.programId),
        senderEligibility:  getEligibilityPDA(sender, this.program.programId),
        receiverEligibility:getEligibilityPDA(receiver, this.program.programId),
        caller:             this.program.provider.publicKey!,
      } as any)
      .instruction();
  }

  /**
   * Constructs subscribe_investment instruction.
   */
  async getSubscribeInvestmentInstruction(
    subscriptionId: BN,
    projectId:      number,
    amount:         BN,
    paymentAsset:   PublicKey,
    registryProgramId: PublicKey
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .subscribeInvestment(subscriptionId, new BN(projectId), amount, paymentAsset)
      .accounts({
        subscription: getSubscriptionPDA(this.program.provider.publicKey!, subscriptionId, this.program.programId),
        investor:     this.program.provider.publicKey!,
        eligibility:  getEligibilityPDA(this.program.provider.publicKey!, this.program.programId),
        projectAccount: getProjectPDA(projectId, registryProgramId),
        projectRegistryProgram: registryProgramId,
        control:      getComplianceControlPDA(this.program.programId),
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  /**
   * Constructs finalize_subscription instruction.
   */
  async getFinalizeSubscriptionInstruction(
    investor:       PublicKey,
    subscriptionId: BN,
    txHash:         number[],
    tokenAmount:    BN
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .finalizeSubscription(txHash, tokenAmount)
      .accounts({
        subscription: getSubscriptionPDA(investor, subscriptionId, this.program.programId),
        control:      getComplianceControlPDA(this.program.programId),
        authority:    this.program.provider.publicKey!,
      } as any)
      .instruction();
  }
}

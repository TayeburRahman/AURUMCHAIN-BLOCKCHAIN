import { Program, BN, utils } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { 
  getComplianceControlPDA, 
  getEligibilityPDA, 
  getSubscriptionPDA, 
  getProjectPDA, 
  getRegistryPDA, 
  getMintAuthorityPDA 
} from '../utils/pdaHelpers';

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
        wallet:      wallet,
        control:     getComplianceControlPDA(this.program.programId),
        authority:   this.program.provider.publicKey!,
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
        wallet:      wallet,
        control:     getComplianceControlPDA(this.program.programId),
        authority:   this.program.provider.publicKey!,
      } as any)
      .instruction();
  }

  /**
   * Fetches and deserializes an InvestorEligibilityAccount.
   * Includes a manual fallback decoder to handle discriminator mismatches during upgrades.
   */
  async fetchEligibilityAccount(wallet: PublicKey): Promise<any> {
    const pda = getEligibilityPDA(wallet, this.program.programId);
    try {
      return await this.program.account.investorEligibilityAccount.fetch(pda);
    } catch (err) {
      const info = await this.program.provider.connection.getAccountInfo(pda);
      if (!info) return null;

      // PURE MANUAL BORSH DECODE (Total Bypass)
      try {
        const rawData = info.data.slice(8); // Skip 8-byte discriminator
        
        // Manual mapping from IDL structure
        // 32 (wallet) + 1 (kyc) + 1 (aml) + 32 (hash) + 1 (invest) + 1 (transfer) + 8 (approval) + 8 (expiry) + 1 (reverif) + 1 (bypass) + 32 (recorded) + 1 (bump)
        
        let offset = 0;
        const wallet = new PublicKey(rawData.slice(offset, offset += 32));
        const kycStatus = rawData[offset++];
        const amlStatus = rawData[offset++];
        const identityHash = Array.from(rawData.slice(offset, offset += 32));
        const investmentAllowed = rawData[offset++] !== 0;
        const transferAllowed = rawData[offset++] !== 0;
        
        const readI64 = (buf: Buffer, off: number) => {
          const low = buf.readInt32LE(off);
          const high = buf.readInt32LE(off + 4);
          return new BN(low).add(new BN(high).mul(new BN(2).pow(new BN(32))));
        };

        const approvalTimestamp = readI64(rawData as Buffer, offset); offset += 8;
        const expiryTimestamp = readI64(rawData as Buffer, offset); offset += 8;
        const reverificationRequired = rawData[offset++] !== 0;
        const lockupBypass = rawData[offset++] !== 0;
        const recordedBy = new PublicKey(rawData.slice(offset, offset += 32));
        const bump = rawData[offset++];

        return {
          wallet,
          kycStatus: { [["pending", "approved", "rejected", "expired"][kycStatus]]: {} },
          amlStatus: { [["clear", "flagged", "blocked"][amlStatus]]: {} },
          identityHash,
          investmentAllowed,
          transferAllowed,
          approvalTimestamp,
          expiryTimestamp,
          reverificationRequired,
          lockupBypass,
          recordedBy,
          bump
        };
      } catch (decodeErr) {
        console.error("[ComplianceRepository] Pure manual decode failed:", decodeErr);
        throw err;
      }
    }
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
        senderWallet:       sender,
        receiverEligibility:getEligibilityPDA(receiver, this.program.programId),
        receiverWallet:     receiver,
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
   * Now requires all accounts for the issue_tokens CPI in Program 1.
   */
  async getFinalizeSubscriptionInstruction(
    investor:               PublicKey,
    subscriptionId:         BN,
    txHash:                 number[],
    tokenAmount:            BN,
    projectId:              number,
    registryProgramId:      PublicKey,
    mint:                   PublicKey,
    investorTokenAccount:   PublicKey
  ): Promise<TransactionInstruction> {
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const idBN = new BN(projectId);

    return await this.program.methods
      .finalizeSubscription(txHash, tokenAmount)
      .accounts({
        subscription:           getSubscriptionPDA(investor, subscriptionId, this.program.programId),
        control:                getComplianceControlPDA(this.program.programId),
        authority:              this.program.provider.publicKey!,
        projectRegistryProgram: registryProgramId,
        registryControl:        getRegistryPDA(registryProgramId),
        registryProject:        getProjectPDA(idBN, registryProgramId),
        mint:                   mint,
        investorTokenAccount:   investorTokenAccount,
        mintAuthorityPda:       getMintAuthorityPDA(idBN, registryProgramId),
        tokenProgram:           TOKEN_PROGRAM_ID,
      } as any)
      .instruction();
  }

  /**
   * Constructs toggle_lockup_bypass instruction.
   */
  async getToggleLockupBypassInstruction(
    investorWallet: PublicKey,
    enabled: boolean
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .toggleLockupBypass(enabled)
      .accounts({
        control: getComplianceControlPDA(this.program.programId),
        eligibility: getEligibilityPDA(investorWallet, this.program.programId),
        investorWallet: investorWallet,
        admin: this.program.provider.publicKey!,
      } as any)
      .instruction();
  }
}

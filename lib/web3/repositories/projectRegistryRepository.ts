import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getRegistryPDA, getProjectPDA, getMintAuthorityPDA } from '../utils/pdaHelpers';

/**
 * ProjectRegistryRepository
 * 
 * Handles raw data access and instruction construction for the Project Registry program.
 * Separation of concerns: This repository does not handle transaction signing or RPC execution.
 */
export class ProjectRegistryRepository {
  private program: Program;

  constructor(program: Program) {
    this.program = program;
  }

  /**
   * Helper to get the Program ID
   */
  getProgramId(): PublicKey {
    return this.program.programId;
  }

  /**
   * Constructs the create_project instruction.
   * 
   * @param params - Project initialization parameters.
   * @returns {Promise<TransactionInstruction>}
   */
  async getCreateProjectInstruction(
    projectId: number,
    params: {
      name: string;
      supplyCap: BN;
      minInvestmentUsdc: BN;
      maxInvestmentUsdc: BN;
      lockupEndTs: BN;
      subscriptionStart: BN;
      subscriptionEnd: BN;
      treasuryWallet: PublicKey;
      acceptedStablecoin: PublicKey;
      distributionCadence: number;
      symbol: string;
      uri: string;
      assetType: any;
      roundLimitTokens: BN;
    }
  ): Promise<TransactionInstruction> {
    const idBN = new BN(projectId);
    return await this.program.methods
      .createProject({
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        supplyCap: params.supplyCap,
        minInvestmentUsdc: params.minInvestmentUsdc,
        maxInvestmentUsdc: params.maxInvestmentUsdc,
        acceptedStablecoin: params.acceptedStablecoin,
        treasuryWallet: params.treasuryWallet,
        lockupEndTs: params.lockupEndTs,
        subscriptionStart: params.subscriptionStart,
        subscriptionEnd: params.subscriptionEnd,
        distributionCadence: params.distributionCadence,
        assetType: params.assetType,
        roundLimitTokens: params.roundLimitTokens,
      })
      .accounts({
        project: getProjectPDA(idBN, this.program.programId),
        control: getRegistryPDA(this.program.programId),
        mintAuthorityPda: getMintAuthorityPDA(idBN, this.program.programId),
        admin: this.program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  /**
   * Constructs the update_project_params instruction.
   */
  async getUpdateProjectParamsInstruction(
    projectId: number,
    params: {
      minInvestmentUsdc: BN | null;
      maxInvestmentUsdc: BN | null;
      subscriptionStart: BN | null;
      subscriptionEnd: BN | null;
      distributionCadence: number | null;
      lockupEndTs: BN | null;
      roundLimitTokens: BN | null;
      assetType: any | null;
      name: string | null;
      symbol: string | null;
      uri: string | null;
    }
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .updateProjectParams(params)
      .accounts({
        project: getProjectPDA(projectId, this.program.programId),
        control: getRegistryPDA(this.program.programId),
        admin: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Constructs the set_project_mint instruction.
   */
  async getSetProjectMintInstruction(
    projectId: number,
    mint: PublicKey
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .setProjectMint(mint)
      .accounts({
        project: getProjectPDA(projectId, this.program.programId),
        control: getRegistryPDA(this.program.programId),
        admin: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Constructs the update_project_status instruction (AC-BC-102).
   */
  async getUpdateProjectStatusInstruction(
    projectId: number,
    newStatus: any,
    isPaused: boolean
  ): Promise<TransactionInstruction> {
    const idBN = new BN(projectId);
    return await this.program.methods
      .updateProjectStatus(idBN, newStatus, isPaused)
      .accounts({
        project: getProjectPDA(idBN, this.program.programId),
        control: getRegistryPDA(this.program.programId),
        admin: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Constructs the revoke_mint_authority instruction.
   */
  async getRevokeMintAuthorityInstruction(
    projectId: number
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .revokeMintAuthority()
      .accounts({
        project: getProjectPDA(projectId, this.program.programId),
        control: getRegistryPDA(this.program.programId),
        superAdmin: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Constructs the initialize_control instruction.
   */
  async getInitializeControlInstruction(
    operationalAdmin: PublicKey,
    operationalLimits: BN
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .initializeControl(operationalAdmin, operationalLimits)
      .accounts({
        control: getRegistryPDA(this.program.programId),
        payer: this.program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
  }

  /**
   * Constructs the set_emergency_pause instruction.
   */
  async getSetEmergencyPauseInstruction(
    isPaused: boolean
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .setEmergencyPause(isPaused)
      .accounts({
        control: getRegistryPDA(this.program.programId),
        superAdmin: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Constructs the transferAuthority instruction.
   */
  async getTransferAuthorityInstruction(
    roleFlag: number,
    newAdmin: PublicKey, // The key belonging to the candidate who MUST sign
    newLimits: BN | null = null
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .transferAuthority(roleFlag, newLimits)
      .accounts({
        control: getRegistryPDA(this.program.programId),
        superAdmin: this.program.provider.publicKey, // Current Super Admin
        newAdmin: newAdmin, // Candidate who must co-sign
      } as any)
      .instruction();
  }

  /**
   * Fetches and deserializes the ControlAccount.
   */
  async fetchControlAccount(): Promise<any> {
    return await this.program.account.controlAccount.fetch(getRegistryPDA(this.program.programId));
  }

  /**
   * Constructs the calibrate_registry instruction.
   */
  async getCalibrateRegistryInstruction(
    newCount: number
  ): Promise<TransactionInstruction> {
    const countBN = new BN(newCount);
    return await this.program.methods
      .calibrateRegistry(countBN)
      .accounts({
        control: getRegistryPDA(this.program.programId),
        admin: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Alias for fetchControlAccount (backwards compatibility).
   */
  async fetchRegistryConfig(): Promise<any> {
    return this.fetchControlAccount();
  }

  /**
   * Fetches and deserializes a specific ProjectAccount.
   */
  async fetchProjectAccount(projectId: number): Promise<any> {
    const pda = getProjectPDA(projectId, this.program.programId);
    return await this.program.account.projectAccount.fetch(pda);
  }

  /**
   * Fetches all project accounts.
   */
  async fetchAllProjects(): Promise<any[]> {
    return await this.program.account.projectAccount.all();
  }

  /**
   * Constructs the issue_tokens instruction.
   */
  async getIssueTokensInstruction(
    projectId: number,
    amount: BN,
    mint: PublicKey,
    recipientTokenAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const idBN = new BN(projectId);
    const mintAuthorityPda = getMintAuthorityPDA(idBN, this.program.programId);

    return await this.program.methods
      .issueTokens(amount)
      .accounts({
        project: getProjectPDA(idBN, this.program.programId),
        control: getRegistryPDA(this.program.programId),
        mint: mint,
        recipientTokenAccount: recipientTokenAccount,
        mintAuthorityPda: mintAuthorityPda,
        admin: this.program.provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();
  }

  /**
   * Constructs the reset_round instruction.
   */
  async getResetRoundInstruction(
    projectId: number,
    newRoundLimit: BN | null = null
  ): Promise<TransactionInstruction> {
    const idBN = new BN(projectId);
    return await this.program.methods
      .resetRound(newRoundLimit)
      .accounts({
        project: getProjectPDA(idBN, this.program.programId),
        control: getRegistryPDA(this.program.programId),
        admin: this.program.provider.publicKey,
      } as any)
      .instruction();
  }
}

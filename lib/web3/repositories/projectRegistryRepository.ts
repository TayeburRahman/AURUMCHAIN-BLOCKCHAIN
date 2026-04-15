import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { getRegistryPDA, getProjectPDA } from '../utils/pdaHelpers';

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
      })
      .accounts({
        project: getProjectPDA(idBN, this.program.programId),
        registry: getRegistryPDA(this.program.programId),
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
    }
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .updateProjectParams(params)
      .accounts({
        project: getProjectPDA(projectId, this.program.programId),
        registry: getRegistryPDA(this.program.programId),
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
        registry: getRegistryPDA(this.program.programId),
        authority: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Constructs any boolean toggle instruction (pause_investments, pause_transfers, etc).
   */
  async getToggleInstruction(
    method: 'pauseInvestments' | 'pauseTransfers' | 'setProjectActive',
    projectId: number,
    value: boolean
  ): Promise<TransactionInstruction> {
    return await (this.program.methods as any)[method](value)
      .accounts({
        project: getProjectPDA(projectId, this.program.programId),
        registry: getRegistryPDA(this.program.programId),
        authority: this.program.provider.publicKey,
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
        registry: getRegistryPDA(this.program.programId),
        authority: this.program.provider.publicKey,
      } as any)
      .instruction();
  }

  /**
   * Constructs the transferAuthority instruction.
   */
  async getTransferAuthorityInstruction(
    superAdmin: PublicKey,
    authority: PublicKey,
    newSuperAdmin: PublicKey | null,
    newAuthority: PublicKey | null
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .transferAuthority(newSuperAdmin, newAuthority)
      .accounts({
        registry: getRegistryPDA(this.program.programId),
        superAdmin,
        authority,
      } as any)
      .instruction();
  }

  /**
   * Fetches and deserializes the RegistryConfig account.
   */
  async fetchRegistryConfig(): Promise<any> {
    return await this.program.account.registryConfig.fetch(getRegistryPDA(this.program.programId));
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
}

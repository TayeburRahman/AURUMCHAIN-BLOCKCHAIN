import { Connection, PublicKey, Transaction, Keypair, SystemProgram } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { 
  MINT_SIZE, 
  TOKEN_PROGRAM_ID, 
  createInitializeMintInstruction, 
  getMinimumBalanceForRentExemptMint 
} from '@solana/spl-token';
import { 
  createCreateMetadataAccountV3Instruction, 
  PROGRAM_ID as METAPLEX_PROGRAM_ID 
} from '@metaplex-foundation/mpl-token-metadata';

import { ProjectRegistryRepository } from '../repositories/projectRegistryRepository';
import { getRegistryProgram } from '../utils/programDiscoverer';
import { getMetadataPDA } from '../utils/pdaHelpers';

/**
 * ProjectRegistryService
 * 
 * High-level service for Project Registry operations.
 * Orchestrates transaction construction and robust RPC execution.
 */
export class ProjectRegistryService {
  private repository: ProjectRegistryRepository;
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
    const program = getRegistryProgram(connection, wallet);
    this.repository = new ProjectRegistryRepository(program);
  }

  /**
   * Fetches a single project by its on-chain ID.
   */
  async fetchProject(projectId: number): Promise<any> {
    try {
      return await this.repository.fetchProjectAccount(projectId);
    } catch (error) {
      console.warn(`[ProjectRegistryService] Project ID ${projectId} not found on-chain.`);
      return null;
    }
  }

  /**
   * Fetches the global registry configuration.
   */
  async fetchRegistryConfig(): Promise<any> {
    try {
      return await this.repository.fetchRegistryConfig();
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Alias for fetchRegistryConfig (backwards compatibility).
   */
  async syncRegistryState(): Promise<any> {
    return this.fetchRegistryConfig();
  }

  /**
   * Fetches all projects from the registry.
   */
  async fetchAllProjects(): Promise<any[]> {
    return await this.repository.fetchAllProjects();
  }

  /**
   * ATOMIC PROJECT CREATION:
   * 1. Creates SPL Mint account
   * 2. Initializes Mint (6 decimals)
   * 3. Registers Metaplex Metadata
   * 4. Initializes Project in Registry
   * 5. Links Mint to Project
   */
  async createProjectWithMint(params: {
    symbol: string;
    name: string;
    uri: string;
    supplyCap: number;
    minInvestmentUsdc: number;
    maxInvestmentUsdc: number;
    lockupEndTs: number;
    subscriptionStart: number;
    subscriptionEnd: number;
    treasuryWallet: PublicKey;
    acceptedStablecoin: PublicKey;
    distributionCadence: number;
  }): Promise<{ signature: string; projectId: number; mintAddress: string }> {
    try {
      if (!this.wallet.publicKey) throw new Error("Wallet not connected");

      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;

      // 1. Get next project ID from registry config
      const registryConfig = await this.repository.fetchRegistryConfig();
      const nextId = (registryConfig.projectCount as BN).toNumber();

      // 2. Prepare instructions
      const lamports = await getMinimumBalanceForRentExemptMint(this.connection);
      const metadataPda = getMetadataPDA(mintAddress);

      const createMintAccIx = SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: mintAddress,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      });

      const initMintIx = createInitializeMintInstruction(
        mintAddress,
        6, // Standard 6 decimals
        this.wallet.publicKey,
        this.wallet.publicKey
      );

      const metadataIx = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPda,
          mint: mintAddress,
          mintAuthority: this.wallet.publicKey,
          payer: this.wallet.publicKey,
          updateAuthority: this.wallet.publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: params.name,
              symbol: params.symbol,
              uri: params.uri,
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null,
            },
            isMutable: true,
            collectionDetails: null,
          },
        }
      );

      const createProjectIx = await this.repository.getCreateProjectInstruction(nextId, {
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        supplyCap: new BN(params.supplyCap).mul(new BN(1_000_000)), // Apply decimals
        minInvestmentUsdc: new BN(params.minInvestmentUsdc).mul(new BN(1_000_000)),
        maxInvestmentUsdc: new BN(params.maxInvestmentUsdc).mul(new BN(1_000_000)),
        lockupEndTs: new BN(params.lockupEndTs),
        subscriptionStart: new BN(params.subscriptionStart),
        subscriptionEnd: new BN(params.subscriptionEnd),
        acceptedStablecoin: params.acceptedStablecoin,
        treasuryWallet: params.treasuryWallet,
        distributionCadence: params.distributionCadence,
      });

      const setMintIx = await this.repository.getSetProjectMintInstruction(nextId, mintAddress);

      // 3. Assemble and Send Transaction
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');
      const transaction = new Transaction().add(
        createMintAccIx,
        initMintIx,
        metadataIx,
        createProjectIx,
        setMintIx
      );
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      transaction.partialSign(mintKeypair);

      const signature = await this.wallet.sendTransaction(transaction, this.connection, {
        skipPreflight: true,
      });

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      return { signature, projectId: nextId, mintAddress: mintAddress.toString() };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Revokes the mint authority for a project (Irreversible).
   */
  async revokeMintAuthority(projectId: number): Promise<string> {
    try {
      const instruction = await this.repository.getRevokeMintAuthorityInstruction(projectId);
      return await this.sendAndConfirm(instruction);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Manually sets the mint address for a project.
   */
  async setProjectMint(projectId: number, mint: PublicKey): Promise<string> {
    try {
      const instruction = await this.repository.getSetProjectMintInstruction(projectId, mint);
      return await this.sendAndConfirm(instruction);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates mutable project parameters.
   */
  async updateProject(projectId: number, params: any): Promise<string> {
    try {
      const instruction = await this.repository.getUpdateProjectParamsInstruction(projectId, params);
      return await this.sendAndConfirm(instruction);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Toggles on-chain project flags.
   */
  async toggleStatus(
    method: 'pauseInvestments' | 'pauseTransfers' | 'setProjectActive',
    projectId: number,
    value: boolean
  ): Promise<string> {
    try {
      const instruction = await this.repository.getToggleInstruction(method, projectId, value);
      return await this.sendAndConfirm(instruction);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Transfers registry authority.
   */
  async transferAuthority(params: {
    newSuperAdmin?: PublicKey | null;
    newAuthority?: PublicKey | null;
  }): Promise<string> {
    try {
      const config = await this.repository.fetchRegistryConfig();
      const instruction = await this.repository.getTransferAuthorityInstruction(
        config.superAdmin,
        config.authority,
        params.newSuperAdmin ?? null,
        params.newAuthority ?? null
      );
      return await this.sendAndConfirm(instruction);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Internal helper for single-instruction transactions.
   */
  private async sendAndConfirm(instruction: any): Promise<string> {
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
  }

  private handleError(error: any): Error {
    console.error("ProjectRegistryService failure:", error);
    if (error.logs) {
      const pattern = /custom program error: (0x[0-9a-fA-F]+)/;
      for (const log of error.logs) {
        const match = log.match(pattern);
        if (match) return new Error(`BLOCKCHAIN_ERROR: Custom Program Error ${match[1]}`);
      }
    }
    return error;
  }
}

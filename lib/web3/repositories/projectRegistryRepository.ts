import { Program, BN, utils } from '@coral-xyz/anchor';
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
      uri: string;
      symbol: string;
      assetType: any;
      distributionCadence: number;
      durationMonths: number;
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
        durationMonths: params.durationMonths,
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
      durationMonths: number | null;
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
    const pda = getRegistryPDA(this.program.programId);
    try {
      return await this.program.account.controlAccount.fetch(pda);
    } catch (err) {
      const info = await this.program.provider.connection.getAccountInfo(pda);
      if (!info) throw err;

      const patterns = ["account:ControlAccount", "account:controlAccount", "ControlAccount", "controlAccount"];
      for (const pattern of patterns) {
        try {
          const tag = utils.sha256.hash(pattern).slice(0, 16);
          const manualData = Buffer.concat([Buffer.from(tag, "hex"), info.data.slice(8)]);
          return this.program.coder.accounts.decode("ControlAccount", manualData);
        } catch (e) { continue; }
      }
      throw err;
    }
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
    try {
      return await this.program.account.projectAccount.fetch(pda);
    } catch (err) {
      const info = await this.program.provider.connection.getAccountInfo(pda);
      if (!info) throw err;
      return this.decodeProjectManual(info.data, pda);
    }
  }

  /**
   * PURE MANUAL BORSH DECODE (Total Bypass)
   */
  private decodeProjectManual(data: Buffer, pubkey: PublicKey): any {
    try {
      const rawData = data.slice(8); // Skip 8-byte discriminator
      let offset = 0;

      const readI64 = (buf: Buffer, off: number) => {
        const low = buf.readInt32LE(off);
        const high = buf.readInt32LE(off + 4);
        return new BN(low).add(new BN(high).mul(new BN(2).pow(new BN(32))));
      };

      const readString = (buf: Buffer, maxLen: number) => {
        const len = buf.readUInt32LE(offset); offset += 4;
        const str = buf.slice(offset, offset + len).toString('utf8');
        offset += maxLen;
        return str;
      };

      const projectId = readI64(rawData as Buffer, offset); offset += 8;
      const registry = new PublicKey(rawData.slice(offset, offset += 32));
      const creator = new PublicKey(rawData.slice(offset, offset += 32));
      const name = readString(rawData as Buffer, 64);
      const symbol = readString(rawData as Buffer, 10);
      const uri = readString(rawData as Buffer, 200);
      
      const supplyCap = readI64(rawData as Buffer, offset); offset += 8;
      const tokensIssued = readI64(rawData as Buffer, offset); offset += 8;
      const minInvestmentUsdc = readI64(rawData as Buffer, offset); offset += 8;
      const maxInvestmentUsdc = readI64(rawData as Buffer, offset); offset += 8;
      const acceptedStablecoin = new PublicKey(rawData.slice(offset, offset += 32));
      const treasuryWallet = new PublicKey(rawData.slice(offset, offset += 32));
      const mint = new PublicKey(rawData.slice(offset, offset += 32));
      const lockupEndTs = readI64(rawData as Buffer, offset); offset += 8;
      const subscriptionStart = readI64(rawData as Buffer, offset); offset += 8;
      const subscriptionEnd = readI64(rawData as Buffer, offset); offset += 8;
      const createdAt = readI64(rawData as Buffer, offset); offset += 8;
      const distributionCadence = rawData[offset++];
      const durationMonths = rawData[offset++];
      const status = rawData[offset++];
      const isPaused = rawData[offset++] !== 0;
      const mintAuthorityRevoked = rawData[offset++] !== 0;
      const roundLimitTokens = readI64(rawData as Buffer, offset); offset += 8;
      const currentRoundIssued = readI64(rawData as Buffer, offset); offset += 8;
      const assetType = rawData[offset++];
      const bump = rawData[offset++];

      return {
        projectId, registry, creator, name, symbol, uri,
        supplyCap, tokensIssued, minInvestmentUsdc, maxInvestmentUsdc,
        acceptedStablecoin, treasuryWallet, mint,
        lockupEndTs, subscriptionStart, subscriptionEnd, createdAt,
        distributionCadence, durationMonths, isPaused, mintAuthorityRevoked,
        roundLimitTokens, currentRoundIssued, bump,
        status: { [["draft", "funding", "active", "completed", "canceled"][status]]: {} },
        assetType: { [["realEstate", "mining", "other"][assetType]]: {} }
      };
    } catch (e) {
      console.error(`[ProjectRegistryRepository] Manual decode failed for ${pubkey.toBase58()}:`, e);
      return null;
    }
  }

  /**
   * Fetches all project accounts using a custom high-performance scanner.
   * Bypasses standard Anchor discriminator checks.
   */
  async fetchAllProjects(): Promise<any[]> {
    const accounts = await this.program.provider.connection.getProgramAccounts(
      this.program.programId,
      {
        filters: [
          { dataSize: 612 } // Filter for ProjectAccount size
        ]
      }
    );

    const results: any[] = [];

    for (const { pubkey, account } of accounts) {
      const decoded = this.decodeProjectManual(account.data, pubkey);
      if (decoded) {
        results.push({ publicKey: pubkey, account: decoded });
      }
    }

    return results;
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

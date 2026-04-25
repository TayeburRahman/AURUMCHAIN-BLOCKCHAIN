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
      tokenPriceUsdc: BN;        // New Field
      distributionMode: number;  // New Field
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
        tokenPriceUsdc: params.tokenPriceUsdc,    // Added
        distributionMode: params.distributionMode, // Added
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
      tokenPriceUsdc: BN | null;      // Added
      distributionMode: number | null; // Added
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
    const pda = getProjectPDA(idBN, this.program.programId);
    const control = getRegistryPDA(this.program.programId);
    
    console.log(`[getUpdateProjectStatusInstruction] ProjectID: ${projectId}`);
    console.log(`[getUpdateProjectStatusInstruction] Derived PDA: ${pda.toBase58()}`);
    console.log(`[getUpdateProjectStatusInstruction] Control PDA: ${control.toBase58()}`);
    console.log(`[getUpdateProjectStatusInstruction] Admin: ${this.program.provider.publicKey?.toBase58()}`);

    return await this.program.methods
      .updateProjectStatus(idBN, newStatus, isPaused)
      .accounts({
        project: pda,
        control: control,
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
    
    // Legacy support is disabled for this new program deployment.
    // Standard Anchor fetch is used for the 600-byte structure.
    try {
      return await this.program.account.projectAccount.fetch(pda);
    } catch (err) {
      const info = await this.program.provider.connection.getAccountInfo(pda);
      if (!info) throw err;
      const data = this.decodeProjectManual(info.data, pda);
      return { ...data, isLegacy: true, publicKey: pda };
    }
  }

  async fetchAllProjects(): Promise<any[]> {
    const accounts = await this.program.account.projectAccount.all();
    const standard = accounts
      .map((a) => ({
        ...(a.account as any),
        publicKey: a.publicKey,
        isLegacy: false,
      }));

    // Fallback: check for uninitialized/legacy accounts that Anchor missed or mis-decoded
    const allPdas = await this.program.provider.connection.getProgramAccounts(this.program.programId);
    const legacy = allPdas
      .filter((a) => !standard.some(s => s.publicKey.equals(a.pubkey)) && a.account.data.length >= 8)
      .map((a) => {
        try {
           const decoded = this.decodeProjectManual(a.account.data, a.pubkey);
           return { ...decoded, publicKey: a.pubkey, isLegacy: true };
        } catch (e) { return null; }
      })
      .filter((a) => a !== null);

    return [...standard, ...legacy];
  }

  /**
   * PURE MANUAL BORSH DECODE (Total Bypass)
   * @param shouldAlign - If true, applies 8-byte alignment for u64/Pubkey fields after strings.
   */
  private decodeProjectManual(data: Buffer, pubkey: PublicKey): any {
    try {
      const rawData = data.slice(8); // Skip 8-byte discriminator
      
      const readI64 = (buf: Buffer, off: number): BN => {
        const low = buf.readInt32LE(off);
        const high = buf.readInt32LE(off + 4);
        return new BN(low).add(new BN(high).mul(new BN(2).pow(new BN(32))));
      };

      const readStringAt = (buf: Buffer, off: number): { str: string, next: number } => {
        const len = buf.readUInt32LE(off);
        const str = buf.slice(off + 4, off + 4 + len).toString('utf8');
        return { str, next: off + 4 + len };
      };

      // 1. Decode Strings (Fixed start at 72)
      let currentOffset = 72;
      const { str: name, next: nameNext } = readStringAt(rawData, currentOffset);
      const { str: symbol, next: symbolNext } = readStringAt(rawData, nameNext);
      const { str: uri, next: uriNext } = readStringAt(rawData, symbolNext);

      // 2. SELF-HEALING: Scan for Timestamp Anchor
      // We look for a sequence of valid Unix timestamps (2020-2080)
      // Project layout: [lockupEndTs, subscriptionStart, subscriptionEnd, createdAt]
      let anchorOffset = -1;
      
      for (let i = uriNext; i < rawData.length - 24; i++) {
        try {
          const t1 = rawData.readBigInt64LE(i);      // lockupEndTs
          const t2 = rawData.readBigInt64LE(i + 8);  // subscriptionStart
          const t3 = rawData.readBigInt64LE(i + 16); // subscriptionEnd
          
          // Validation: 
          // 1. t2 (Start) and t3 (End) must be valid timestamps
          // 2. t3 must be >= t2
          const isValid = (t: bigint) => t > 1500000000n && t < 2500000000n;
          const isZeroOrValid = (t: bigint) => t === 0n || isValid(t);

          if (isValid(t2) && isValid(t3) && t3 >= t2 && isZeroOrValid(t1)) {
            anchorOffset = i;
            break;
          }
        } catch (e) { continue; }
      }

      if (anchorOffset === -1) {
        throw new Error(`Could not find timestamp anchor for project ${pubkey.toBase58()}`);
      }

      // 3. SECOND ANCHOR: Scan for Status Block Pattern [Cadence, Status, Paused, Revoked]
      // Status is 1 (Funding), Paused is 0, Revoked is 0. 
      // This is usually shortly after the createdAt timestamp.
      let statusOffset = -1;
      for (let i = anchorOffset + 32; i < rawData.length - 4; i++) {
        if (rawData[i + 1] === 1 && rawData[i + 2] === 0 && rawData[i + 3] === 0) {
          statusOffset = i;
          break;
        }
      }

      if (statusOffset === -1) {
        // Fallback: If not found, try searching for [any, 0, 0, 0] (Draft)
        for (let i = anchorOffset + 32; i < rawData.length - 4; i++) {
          if (rawData[i + 1] === 0 && rawData[i + 2] === 0 && rawData[i + 3] === 0) {
            statusOffset = i;
            break;
          }
        }
      }

      if (statusOffset === -1) {
        throw new Error(`Could not find status anchor for project ${pubkey.toBase58()}`);
      }

      const lockupEndTs = readI64(rawData, anchorOffset);
      const subscriptionStart = readI64(rawData, anchorOffset + 8);
      const subscriptionEnd = readI64(rawData, anchorOffset + 16);
      const createdAt = readI64(rawData, anchorOffset + 24);

      const mint = new PublicKey(rawData.slice(anchorOffset - 32, anchorOffset));
      const treasuryWallet = new PublicKey(rawData.slice(anchorOffset - 64, anchorOffset - 32));
      const acceptedStablecoin = new PublicKey(rawData.slice(anchorOffset - 96, anchorOffset - 64));

      const maxInvestmentUsdc = readI64(rawData, anchorOffset - 104);
      const minInvestmentUsdc = readI64(rawData, anchorOffset - 112);
      const tokensIssued = readI64(rawData, anchorOffset - 120);
      const supplyCap = readI64(rawData, anchorOffset - 128);

      const distributionCadence = rawData[statusOffset];
      const status = rawData[statusOffset + 1];
      const isPaused = rawData[statusOffset + 2] !== 0;
      const mintAuthorityRevoked = rawData[statusOffset + 3] !== 0;

      // projectId is always at start
      const projectId = readI64(rawData, 0);
      const registry = new PublicKey(rawData.slice(8, 40));
      const creator = new PublicKey(rawData.slice(40, 72));

      // New V2 fields (roundLimitTokens) are after the status block
      // In legacy, these were often packed right after revoked
      let roundOffset = statusOffset + 4;
      // Skip 1 byte if it's the mysterious 0x00/0x0c padding sometimes seen
      if (rawData[roundOffset] === 0 || rawData[roundOffset] === 12) roundOffset++; 
      
      const roundLimitTokens = readI64(rawData, roundOffset);
      const currentRoundIssued = readI64(rawData, roundOffset + 8);
      const assetType = rawData[roundOffset + 16] || 0;
      const bump = rawData[roundOffset + 17] || 0;
      const durationMonths = rawData[roundOffset + 18] || 12;

      const statusVariants = ["draft", "funding", "active", "completed", "canceled"];
      const assetTypeVariants = ["realEstate", "mining", "other"];

      const statusKey = statusVariants[status] || "draft";
      const assetTypeKey = assetTypeVariants[assetType] || "realEstate";

      return {
        projectId, registry, creator, name, symbol, uri,
        supplyCap, tokensIssued, minInvestmentUsdc, maxInvestmentUsdc,
        acceptedStablecoin, treasuryWallet, mint,
        lockupEndTs, subscriptionStart, subscriptionEnd, createdAt,
        distributionCadence, durationMonths, isPaused, mintAuthorityRevoked,
        roundLimitTokens, currentRoundIssued, bump,
        status: { [statusKey]: {} },
        assetType: { [assetTypeKey]: {} }
      };
    } catch (e) {
      console.error(`[ProjectRegistryRepository] Manual decode failed for ${pubkey.toBase58()}:`, e);
      return null;
    }
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

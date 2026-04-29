import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getServerAnchorProvider } from '../clients/serverAnchorProvider';
import { getComplianceProgram, getRegistryProgram } from '../clients/anchorClients';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } from '@solana/spl-token';
import { 
  getSubscriptionPDA, 
  getComplianceControlPDA, 
  getProjectPDA, 
  getRegistryPDA, 
  getMintAuthorityPDA 
} from '../utils/pdaHelpers';
import bs58 from 'bs58';
import { TokenMath } from '@/lib/utils/tokenMath';
import { ProjectRegistryService } from './projectRegistryService';
import { Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { confirmTransactionRobustly } from '../utils/transactionUtils';

/**
 * AdminBlockchainService
 * 
 * Server-side service for performing administrative blockchain operations.
 * Uses the server provider to sign transactions with the administrative key.
 */
export class AdminBlockchainService {
  /**
   * Finalizes an investment subscription on-chain.
   * 
   * @param params - details of the subscription and settlement.
   * @returns The transaction signature.
   */
  static async settleInvestment(params: {
    subscriptionId: number;
    investor: string;
    allocatedTokenAmount: number;
    paymentTxHash: string; // Background reference (e.g., Stripe/Bank ID or Solana Sig)
  }): Promise<string> {
    try {
      const provider = getServerAnchorProvider();
      const complianceProgram = getComplianceProgram(provider.connection, provider.wallet);
      const registryProgram = getRegistryProgram(provider.connection, provider.wallet);
      
      const investorPubkey = new PublicKey(params.investor);
      const subscriptionIdBN = new BN(params.subscriptionId);

      // 1. Fetch Subscription to get Project ID
      console.log(`[AdminBlockchainService] Fetching subscription ${params.subscriptionId}...`);
      const subscriptionPda = getSubscriptionPDA(investorPubkey, subscriptionIdBN, complianceProgram.programId);
      const subscriptionData: any = await complianceProgram.account.investmentSubscriptionAccount.fetch(subscriptionPda);
      const projectId = (subscriptionData.projectId as BN).toNumber();

      // 2. Fetch Project to get Mint
      const projectPda = getProjectPDA(projectId, registryProgram.programId);
      const projectData: any = await registryProgram.account.projectAccount.fetch(projectPda);
      const mint = projectData.mint as PublicKey;

      if (!mint || mint.equals(PublicKey.default)) {
        throw new Error(`Project ${projectId} has no linked mint. Cannot settle.`);
      }

      // 3. Resolve Investor ATA
      const investorTokenAccount = getAssociatedTokenAddressSync(mint, investorPubkey);

      // 4. Prepare Tx Hash (64 bytes)
      let txHashBytes = Buffer.alloc(64);
      try {
        const decoded = bs58.decode(params.paymentTxHash);
        const dataToCopy = decoded.slice(0, 64);
        txHashBytes.set(dataToCopy);
      } catch {
        Buffer.from(params.paymentTxHash.slice(0, 64)).copy(txHashBytes);
      }

      // 5. Fetch Mint Info to get Decimals (AC-BC-406 Dynamic Decimals)
      // 3. Fetch ACTUAL decimals from the blockchain for this specific project
      const registryService = new ProjectRegistryService(provider.connection, {});
      const fetchedProject = await registryService.fetchProject(projectId);
      if (!fetchedProject) throw new Error(`Project ${projectId} not found on-chain.`);
      
      const decimals = fetchedProject.tokenDecimals || 9;
      const scaledAmount = TokenMath.toRawTokens(params.allocatedTokenAmount, decimals);

      console.log(`[AdminWeb3] Scaling: ${params.allocatedTokenAmount} tokens -> ${scaledAmount.toString()} raw units (Decimals: ${decimals})`);

      // 6. Build transaction with ATA initialization + finalize
      console.log(`[AdminBlockchainService] Settling subscription ${params.subscriptionId} for project ${projectId} with scaled amount ${scaledAmount.toString()} (${decimals} decimals)...`);
      
      const finalizeIx = await complianceProgram.methods
        .finalizeSubscription(
          Array.from(txHashBytes),
          scaledAmount
        )
        .accounts({
          subscription:           subscriptionPda,
          control:                getComplianceControlPDA(complianceProgram.programId),
          authority:              provider.wallet.publicKey,
          projectRegistryProgram: registryProgram.programId,
          registryControl:        getRegistryPDA(registryProgram.programId),
          registryProject:        projectPda,
          mint:                   mint,
          investorTokenAccount:   investorTokenAccount,
          mintAuthorityPda:       getMintAuthorityPDA(projectId, registryProgram.programId),
          tokenProgram:           TOKEN_PROGRAM_ID,
        } as any)
        .instruction();

      // Ensure investor project token ATA exists (AC-BC-406 Fix)
      const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        provider.wallet.publicKey,
        investorTokenAccount,
        investorPubkey,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction()
        .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }))
        .add(createAtaIx)
        .add(finalizeIx);

      // Manual send and robust confirm to bypass signatureSubscribe (AC-BC-406 Fix)
      const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.wallet.publicKey;
      
      const signed = await provider.wallet.signTransaction(transaction);
      const tx = await provider.connection.sendRawTransaction(signed.serialize());
      
      await confirmTransactionRobustly(provider.connection, tx, lastValidBlockHeight);

      return tx;
    } catch (error) {
      console.error("[AdminBlockchainService] settleInvestment failed:", error);
      throw error;
    }
  }

  /**
   * Updates a project's active/paused status on-chain.
   */
  static async updateProjectStatus(params: {
    projectId: number;
    isActive: boolean;
    isPaused: boolean;
  }): Promise<string> {
    try {
      const provider = getServerAnchorProvider();
      const program = getRegistryProgram(provider.connection, provider.wallet);
      
      const projectIdBN = new BN(params.projectId);

      // 1. Derive PDAs
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), projectIdBN.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [controlPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("control")],
        program.programId
      );

      // 2. Execute
      const signature = await program.methods
        .updateProjectStatus(
          projectIdBN,
          params.isActive,
          params.isPaused
        )
        .accounts({
          control: controlPda,
          project: projectPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();

      return signature;
    } catch (error) {
      console.error("[AdminBlockchainService] updateProjectStatus failed:", error);
      throw error;
    }
  }

  /**
   * Records a verified wallet on-chain.
   */
  static async verifyInvestor(params: {
    wallet: string;
    kycStatus: string;
    investmentAllowed: boolean;
    transferAllowed: boolean;
    expiryDays: number;
  }): Promise<string> {
    try {
      const provider = getServerAnchorProvider();
      const program = getComplianceProgram(provider.connection, provider.wallet);
      
      const walletPubkey = new PublicKey(params.wallet);
      
      // Calculate PDA
      const [eligibilityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("eligibility"), walletPubkey.toBuffer()],
        program.programId
      );

      const controlPda = getComplianceControlPDA(program.programId);

      // Prepare params
      const kycStatusMap: any = {
        'approved': { approved: {} },
        'pending': { pending: {} },
        'rejected': { rejected: {} },
        'expired': { expired: {} }
      };

      const expiryTimestamp = new BN(Math.floor(Date.now() / 1000) + (params.expiryDays * 24 * 60 * 60));

      const tx = await program.methods
        .recordVerifiedWallet({
          kycStatus: kycStatusMap[params.kycStatus.toLowerCase()] || { pending: {} },
          amlStatus: { clear: {} },
          identityHash: Array(32).fill(1), // Non-zero dummy hash for manual verification
          investmentAllowed: params.investmentAllowed,
          transferAllowed: params.transferAllowed,
          expiryTimestamp: expiryTimestamp
        })
        .accounts({
          eligibility: eligibilityPda,
          wallet: walletPubkey,
          control: controlPda,
          authority: provider.wallet.publicKey,
          systemProgram: new PublicKey('11111111111111111111111111111111'),
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      console.error("[AdminBlockchainService] verifyInvestor failed:", error);
      throw error;
    }
  }
}

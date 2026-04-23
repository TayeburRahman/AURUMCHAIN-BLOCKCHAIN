import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getServerAnchorProvider } from '../clients/serverAnchorProvider';
import { getComplianceProgram, getRegistryProgram } from '../clients/anchorClients';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { 
  getSubscriptionPDA, 
  getComplianceControlPDA, 
  getProjectPDA, 
  getRegistryPDA, 
  getMintAuthorityPDA 
} from '../utils/pdaHelpers';
import bs58 from 'bs58';

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

      // 5. Execute transaction with ALL required accounts for CPI
      console.log(`[AdminBlockchainService] Settling subscription ${params.subscriptionId} for project ${projectId}...`);
      
      const tx = await complianceProgram.methods
        .finalizeSubscription(
          Array.from(txHashBytes),
          new BN(params.allocatedTokenAmount)
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
        .rpc();

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
}

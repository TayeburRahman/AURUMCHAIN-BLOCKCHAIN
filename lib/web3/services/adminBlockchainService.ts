import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getServerAnchorProvider } from '../clients/serverAnchorProvider';
import { getComplianceProgram, getRegistryProgram } from '../clients/anchorClients';
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
      const program = getComplianceProgram(provider.connection, provider.wallet);
      
      const investorPubkey = new PublicKey(params.investor);
      const subscriptionIdBN = new BN(params.subscriptionId);

      // 1. Derive Subscription PDA
      const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          investorPubkey.toBuffer(),
          subscriptionIdBN.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );

      // 2. Derive Control PDA
      const [controlPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("compliance_control")],
        program.programId
      );

      // 3. Prepare Tx Hash (64 bytes)
      let txHashBytes = Buffer.alloc(64);
      try {
        // Attempt to decode as Base58 (Solana Signature)
        const decoded = bs58.decode(params.paymentTxHash);
        const dataToCopy = decoded.slice(0, 64);
        txHashBytes.set(dataToCopy);
      } catch {
        // Fallback to literal string padding
        Buffer.from(params.paymentTxHash.slice(0, 64)).copy(txHashBytes);
      }

      // 4. Execute transaction
      console.log(`[AdminBlockchainService] Settling subscription ${params.subscriptionId} for ${params.investor}...`);
      
      const tx = await program.methods
        .finalizeSubscription(
          Array.from(txHashBytes),
          new BN(params.allocatedTokenAmount)
        )
        .accounts({
          subscription: subscriptionPda,
          control: controlPda,
          authority: provider.wallet.publicKey,
        })
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

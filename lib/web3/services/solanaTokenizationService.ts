import { 
  Connection, 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  Transaction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  getMint,
  getAssociatedTokenAddressSync
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { 
  ITokenizationService, 
  TokenizationInput, 
  TokenizationResult 
} from '../../domains/shared/blockchain-interfaces';
import { getRegistryProgram } from '../clients/anchorClients';
import { confirmTransactionRobustly } from '../utils/transactionUtils';

/**
 * SolanaTokenizationService
 * 
 * Implementation of ITokenizationService for the Solana blockchain.
 * Manages SPL Token creation, minting, and balance tracking.
 */
export class SolanaTokenizationService implements ITokenizationService {
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /**
   * Deploys a new SPL Mint and links it to the project on-chain.
   */
  async deployToken(input: TokenizationInput): Promise<TokenizationResult> {
    try {
      console.log(`[TokenizationService] Deploying token for project ${input.projectId}...`);
      
      // 1. Create a new Mint
      // Note: In production, the Mint Authority should ideally be a PDA of the Program or a Multi-Sig.
      // For Milestone 2, we use the admin wallet as the authority.
      const mintKeypair = Keypair.generate();
      const mintPubkey = await createMint(
        this.connection,
        this.wallet.payer || this.wallet, // Payer
        this.wallet.publicKey,           // Mint Authority
        this.wallet.publicKey,           // Freeze Authority
        6,                               // Decimals (Standard for gold/USDC)
        mintKeypair
      );

      // 2. Link Mint to Project Account in the Registry
      const program = getRegistryProgram(this.connection, this.wallet);
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), new BN(input.projectId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [controlPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("control")],
        program.programId
      );

      const tx = await program.methods
        .setProjectMint(mintPubkey)
        .accounts({
          control: controlPda,
          project: projectPda,
          admin: this.wallet.publicKey,
        })
        .rpc();

      await this.connection.confirmTransaction(tx, 'confirmed');

      const mintInfo = await getMint(this.connection, mintPubkey);

      return {
        contractAddress: mintPubkey.toBase58() as any,
        deploymentTxHash: tx as any,
        blockNumber: BigInt(0), // Not strictly needed for UI
        tokenSymbol: input.tokenSymbol,
        tokenName: input.tokenName,
        totalSupply: BigInt(mintInfo.supply.toString()),
        chainId: input.chainId,
      };
    } catch (error) {
      console.error("[TokenizationService] deployToken error:", error);
      throw error;
    }
  }

  /**
   * Mints tokens to an investor's wallet.
   */
  async mintTokens(
    contractAddress: string,
    toAddress: string,
    amount: bigint,
    _chainId: number
  ): Promise<string> {
    try {
      const mintPubkey = new PublicKey(contractAddress);
      const recipientPubkey = new PublicKey(toAddress);

      // 1. Get or create ATA for the recipient
      const ata = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet.payer || this.wallet,
        mintPubkey,
        recipientPubkey
      );
      console.log(`[TokenizationService] Minting to ATA: ${ata.address.toBase58()}`);

      // 2. Mint tokens
      const signature = await mintTo(
        this.connection,
        this.wallet.payer || this.wallet,
        mintPubkey,
        ata.address,
        this.wallet.publicKey,
        amount
      );

      await this.connection.confirmTransaction(signature, 'confirmed');

      return signature as string;
    } catch (error) {
      console.error("[TokenizationService] mintTokens error:", error);
      throw error;
    }
  }

  /**
   * Fetches the current balance of a token for a specific wallet.
   */
  async getBalance(
    contractAddress: string,
    holderAddress: string,
    _chainId: number
  ): Promise<bigint> {
    try {
      const mintPubkey = new PublicKey(contractAddress);
      const holderPubkey = new PublicKey(holderAddress);

      const ata = getAssociatedTokenAddressSync(
        mintPubkey,
        holderPubkey
      );
      console.log(`[TokenizationService] Checking balance for ATA: ${ata.toBase58()}`);

      const balance = await this.connection.getTokenAccountBalance(ata);
      return BigInt(balance.value.amount);
    } catch (error: any) {
      // If account doesn't exist, balance is 0
      if (error.message?.includes("could not find account")) return BigInt(0);
      return BigInt(0);
    }
  }

  /**
   * Returns total supply of the given token.
   */
  async getTotalSupply(contractAddress: string, _chainId: number): Promise<bigint> {
    try {
      const mintInfo = await getMint(this.connection, new PublicKey(contractAddress));
      return BigInt(mintInfo.supply.toString());
    } catch (error) {
      return BigInt(0);
    }
  }
}

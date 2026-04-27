import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { confirmTransactionRobustly } from '../utils/transactionUtils';

export class WalletService {
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /**
   * Deposit USDC into the treasury
   */
  async depositUSDC(amount: number): Promise<string> {
    if (!this.wallet.publicKey) throw new Error("Wallet not connected");

    const usdcMint = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const treasuryWallet = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_WALLET || '7STXs2LXLimTiPBuvrcnE1u7vQFCw9GoCKmhs3QsuSk4');

    const investorAta = getAssociatedTokenAddressSync(usdcMint, this.wallet.publicKey);
    const treasuryAta = getAssociatedTokenAddressSync(usdcMint, treasuryWallet);

    const amountBN = BigInt(Math.round(amount * 1_000_000)); // 6 decimals for USDC

    const instruction = createTransferInstruction(
      investorAta,
      treasuryAta,
      this.wallet.publicKey,
      amountBN,
      [],
      TOKEN_PROGRAM_ID
    );

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
    const transaction = new Transaction().add(instruction);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.wallet.publicKey;

    const signature = await this.wallet.sendTransaction(transaction, this.connection);

    await confirmTransactionRobustly(
      this.connection,
      signature,
      lastValidBlockHeight,
      'confirmed'
    );

    return signature;
  }
}

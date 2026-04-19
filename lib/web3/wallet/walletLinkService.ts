import { WalletContextState } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

/**
 * WalletLinkService
 * 
 * Handles the two-step wallet linking process:
 * 1. Registering the intent to connect (connect)
 * 2. Proving ownership via signed message (verify)
 */
export class WalletLinkService {
  /**
   * Links a Solana wallet to the currently logged-in user profile.
   */
  static async linkWallet(
    wallet: WalletContextState,
    chainId: number = 101 // Default to Solana Devnet/Mainnet identifier
  ) {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error("Wallet not connected or does not support message signing");
    }

    const walletAddress = wallet.publicKey.toBase58();

    // Step 1: Record the connection intent in the database
    const connectResponse = await fetch("/api/wallet/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        chainId,
        walletType: wallet.wallet?.adapter.name,
      }),
    });

    if (!connectResponse.ok) {
      const error = await connectResponse.json();
      throw new Error(error.error || "Failed to initiate wallet connection");
    }

    const { walletLink } = await connectResponse.json();

    // Step 2: Generate a simple challenge message
    // In a production environment, this nonce should be fetched from the server.
    const nonce = Math.random().toString(36).substring(2, 15);
    const message = `Sign this message to verify ownership of wallet ${walletAddress} for AURUMCHAIN. Nonce: ${nonce}`;
    const encodedMessage = new TextEncoder().encode(message);

    // Step 3: Request the signature from the wallet
    let signature: string;
    try {
      const signatureBytes = await wallet.signMessage(encodedMessage);
      signature = bs58.encode(signatureBytes);
    } catch (err: any) {
      throw new Error(err.message || "Message signing rejected by user");
    }

    // Step 4: Verify the signature on the server
    const verifyResponse = await fetch("/api/wallet/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletLinkId: walletLink.id,
        signature,
        message,
        nonce,
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.error || "Signature verification failed");
    }

    return await verifyResponse.json();
  }

  /**
   * Fetches the current linked wallet status from the server.
   */
  static async getLinkedWalletStatus() {
    const response = await fetch("/api/wallet/active");
    if (!response.ok) return null;
    return await response.json();
  }
}

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * ServerAnchorProvider factory
 * 
 * Creates a secure, server-side Anchor provider using administrative keys.
 * This should ONLY be used in server-side files (API routes, background workers).
 */
export function getServerAnchorProvider(): anchor.AnchorProvider {
  const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(RPC_URL, "confirmed");

  const privateKeyStr = process.env.WALLET_PRIVATE_KEY;
  if (!privateKeyStr) {
    throw new Error("SERVER_RPC_ERROR: WALLET_PRIVATE_KEY not found in environment. Backend signing disabled.");
  }

  let secretKey: Uint8Array;
  try {
    secretKey = privateKeyStr.startsWith("[")
      ? Uint8Array.from(JSON.parse(privateKeyStr))
      : bs58.decode(privateKeyStr);
  } catch (err) {
    throw new Error("SERVER_RPC_ERROR: Invalid WALLET_PRIVATE_KEY format (expected JSON array or Base58 string).");
  }

  const keypair = Keypair.fromSecretKey(secretKey);
  const wallet = new anchor.Wallet(keypair);

  return new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

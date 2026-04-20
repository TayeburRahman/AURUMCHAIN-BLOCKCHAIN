import { Connection, SignatureStatus, TransactionSignature } from '@solana/web3.js';

/**
 * Robustly confirms a transaction using a polling strategy.
 * This avoids the common 'signatureSubscribe' WebSocket errors in web environments.
 * 
 * @param connection Solana connection object
 * @param signature Transaction signature to confirm
 * @param lastValidBlockHeight The block height until which the transaction is valid
 * @param commitment The desired commitment level (default: 'confirmed')
 * @param pollIntervalMs Interval between polling attempts in milliseconds (default: 2000)
 * @param maxAttempts Maximum number of polling attempts (default: 45, ~90 seconds)
 */
export async function confirmTransactionRobustly(
  connection: Connection,
  signature: TransactionSignature,
  lastValidBlockHeight: number,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed',
  pollIntervalMs: number = 2000,
  maxAttempts: number = 45
): Promise<void> {
  console.log(`[transactionUtils] Starting robust confirmation for: ${signature.slice(0, 8)}...`);
  
  let confirmed = false;
  let attempts = 0;

  while (!confirmed && attempts < maxAttempts) {
    try {
      const status = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: false
      });

      if (status.value?.err) {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.value.err)}`);
      }

      const confirmationStatus = status.value?.confirmationStatus;
      
      // If the commitment matches or is 'stronger' (finalized > confirmed > processed)
      if (confirmationStatus === commitment || confirmationStatus === 'finalized' || (commitment === 'processed' && confirmationStatus === 'confirmed')) {
        confirmed = true;
        console.log(`[transactionUtils] Transaction ${confirmationStatus}!`);
        return;
      }

      // Check if the blockheight has been exceeded
      const currentBlockHeight = await connection.getBlockHeight();
      if (currentBlockHeight > lastValidBlockHeight) {
        throw new Error("Transaction expired: block height exceeded.");
      }

      // Wait for the next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      attempts++;
    } catch (error: any) {
      // Re-throw if it's a terminal error (failed on-chain or expired)
      if (error.message.includes("failed on-chain") || error.message.includes("expired")) {
        throw error;
      }
      
      // Otherwise log and continue polling (handle transient RPC errors)
      console.warn(`[transactionUtils] Polling attempt ${attempts} failed: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      attempts++;
    }
  }

  if (!confirmed) {
    throw new Error(`Transaction confirmation timed out after ${Math.floor((maxAttempts * pollIntervalMs) / 1000)} seconds of polling.`);
  }
}

import { Connection, clusterApiUrl } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env only in Node environments (scripts/tests)
if (typeof window === 'undefined') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

/**
 * Global Blockchain RPC Configuration
 * 
 * This file centralizes the RPC endpoint selection logic.
 * Swapping providers (e.g. Alchemy vs public node) only requires
 * changing the .env variable.
 */

const NETWORK = 'devnet';

/**
 * The master RPC URL used by the entire application.
 * Prioritizes .env, then falls back to public devnet.
 */
export const SOLANA_RPC_URL = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  'https://solana-devnet.g.alchemy.com/v2/4ZYO0JBTWn7EHda1T-bf5';

export const FALLBACK_RPC_URL = 'https://api.devnet.solana.com';

/**
 * Standard Connection configuration for consistency.
 */
export const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 90000, // 90s timeout for stability
  // Automatic Fallback Middleware
  fetchMiddleware: async (info: any, init: any, fetch: any) => {
    try {
      const response = await fetch(info, init);
      // Fallback on rate limits or server errors
      if (response && (response.status === 429 || response.status >= 500)) {
        console.warn(`[RPC] Primary endpoint ${SOLANA_RPC_URL} failed with ${response.status}. Falling back...`);
        const fallbackInfo = typeof info === 'string' 
          ? info.replace(SOLANA_RPC_URL, FALLBACK_RPC_URL)
          : info;
        return await fetch(fallbackInfo, init);
      }
      return response;
    } catch (err) {
      console.warn(`[RPC] Primary endpoint ${SOLANA_RPC_URL} threw error. Falling back...`, err);
      const fallbackInfo = typeof info === 'string' 
        ? info.replace(SOLANA_RPC_URL, FALLBACK_RPC_URL)
        : info;
      return await fetch(fallbackInfo, init);
    }
  }
};

/**
 * Factory for creating a standard Connection object.
 */
export const createDefaultConnection = () => {
  return new Connection(SOLANA_RPC_URL, CONNECTION_CONFIG);
};

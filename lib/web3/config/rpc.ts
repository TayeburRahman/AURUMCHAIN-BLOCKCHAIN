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
  'https://solana-devnet.g.alchemy.com/v2/4ZYO0JBTWn7EHda1T-bf5';

export const FALLBACK_RPC_URL = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  'https://api.devnet.solana.com';

/**
 * Standard Connection configuration for consistency.
 */
export const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 90000, // 90s timeout for stability
  // Automatic Fallback Middleware
  fetchMiddleware: async (info: any, init: any, fetch: any) => {
    try {
      let currentUrl = typeof info === 'string' ? info : info.url;
      let body = init?.body ? JSON.parse(init.body) : null;

      // BYPASS: Alchemy Free tier doesn't support getProgramAccounts.
      // Force these calls to use the public Devnet.
      if (body?.method === 'getProgramAccounts' && currentUrl.includes('alchemy')) {
        const bypassUrl = FALLBACK_RPC_URL;
        console.log(`[RPC] Routing getProgramAccounts to public Devnet (Alchemy restriction)...`);
        return await fetch(bypassUrl, init);
      }

      const response = await fetch(info, init);
      
      // Fallback on rate limits (429), server errors (500+), or Alchemy restrictions (400)
      if (response && (response.status === 429 || response.status >= 500 || response.status === 400)) {
        const fallbackUrl = typeof info === 'string' 
          ? info.replace(SOLANA_RPC_URL, FALLBACK_RPC_URL)
          : FALLBACK_RPC_URL;
          
        console.warn(`[RPC] Request failed (${response.status}). Retrying with ${fallbackUrl}...`);
        return await fetch(fallbackUrl, init);
      }
      return response;
    } catch (err) {
      console.warn(`[RPC] Request threw error. Falling back...`, err);
      return await fetch(FALLBACK_RPC_URL, init);
    }
  }
};

/**
 * Factory for creating a standard Connection object.
 */
export const createDefaultConnection = () => {
  return new Connection(SOLANA_RPC_URL, CONNECTION_CONFIG);
};

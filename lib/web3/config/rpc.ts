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
  clusterApiUrl(NETWORK);

/**
 * Standard Connection configuration for consistency.
 */
export const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 90000, // 90s timeout for stability
};

/**
 * Factory for creating a standard Connection object.
 */
export const createDefaultConnection = () => {
  return new Connection(SOLANA_RPC_URL, CONNECTION_CONFIG);
};

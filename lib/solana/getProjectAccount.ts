/**
 * Server-side utility to fetch on-chain ProjectAccount data.
 * Does NOT require a browser wallet — read-only connection only.
 * Used by API routes to enrich Supabase project data with chain state.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from '@/programs/project_registry/src/idl.json';
import { BN } from '@coral-xyz/anchor';

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID ||
  'GcXxLjcCm7ov3i6QqQsL8zgjqiknWBswXn6jcwpEMYdC'
);

const REGISTRY_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from('registry')],
  PROGRAM_ID
)[0];

export interface OnChainProjectData {
  projectId: number;
  symbol: string;
  uri: string;
  supplyCap: number;
  tokensIssued: number;
  minInvestmentUsdc: number;
  maxInvestmentUsdc: number;
  acceptedStablecoin: string;
  treasuryWallet: string;
  mint: string;
  lockupEndTs: number;
  subscriptionStart: number;
  subscriptionEnd: number;
  distributionCadence: number;
  isActive: boolean;
  investmentsPaused: boolean;
  transfersPaused: boolean;
  mintAuthorityRevoked: boolean;
  creator: string;
  pda: string;
}

function getReadOnlyProgram(): Program {
  const connection = new Connection(
    'https://api.devnet.solana.com',
    { commitment: 'confirmed', fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) }
  );

  // Read-only provider — no wallet signing needed
  const provider = new AnchorProvider(
    connection,
    { publicKey: PublicKey.default, signAllTransactions: async (txs) => txs, signTransaction: async (tx) => tx },
    { commitment: 'confirmed' }
  );

  return new Program(idl as any, PROGRAM_ID, provider);
}

/**
 * Derives the project PDA from a numeric project ID (the on-chain sequential counter).
 */
export function getProjectPDA(projectId: number): PublicKey {
  const idBN = new BN(projectId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('project'), idBN.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  )[0];
}

/**
 * Fetches a single ProjectAccount from the Solana devnet.
 * Returns null if the account is not found or the project ID is not set (not yet on-chain).
 */
export async function getProjectAccount(projectId: number): Promise<OnChainProjectData | null> {
  try {
    const program = getReadOnlyProgram();
    const pda = getProjectPDA(projectId);
    const account: any = await program.account.projectAccount.fetch(pda);

    const DEFAULT_PUBKEY = PublicKey.default.toString();

    return {
      projectId:          (account.projectId as BN).toNumber(),
      symbol:             account.symbol as string,
      uri:                account.uri as string,
      supplyCap:          (account.supplyCap as BN).toNumber(),
      tokensIssued:       (account.tokensIssued as BN).toNumber(),
      minInvestmentUsdc:  (account.minInvestmentUsdc as BN).toNumber(),
      maxInvestmentUsdc:  (account.maxInvestmentUsdc as BN).toNumber(),
      acceptedStablecoin: (account.acceptedStablecoin as PublicKey).toString(),
      treasuryWallet:     (account.treasuryWallet as PublicKey).toString(),
      mint:               (account.mint as PublicKey).toString(),
      lockupEndTs:        (account.lockupEndTs as BN).toNumber(),
      subscriptionStart:  (account.subscriptionStart as BN).toNumber(),
      subscriptionEnd:    (account.subscriptionEnd as BN).toNumber(),
      distributionCadence: account.distributionCadence as number,
      isActive:            account.isActive as boolean,
      investmentsPaused:   account.investmentsPaused as boolean,
      transfersPaused:     account.transfersPaused as boolean,
      mintAuthorityRevoked: account.mintAuthorityRevoked as boolean,
      creator:             (account.creator as PublicKey).toString(),
      pda:                 pda.toString(),
    };
  } catch (err: any) {
    // Account not found or RPC error — return null gracefully so the page still loads
    console.warn(`[getProjectAccount] Failed to fetch chain data for projectId=${projectId}:`, err?.message);
    return null;
  }
}

/**
 * Bulk-fetches on-chain accounts for multiple project IDs in parallel.
 * Failures per-project are swallowed so one bad account doesn't break the page.
 */
export async function getProjectAccountsBulk(
  projectIds: number[]
): Promise<Map<number, OnChainProjectData>> {
  const results = await Promise.allSettled(
    projectIds.map((id) => getProjectAccount(id))
  );

  const map = new Map<number, OnChainProjectData>();
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      map.set(projectIds[index], result.value);
    }
  });
  return map;
}

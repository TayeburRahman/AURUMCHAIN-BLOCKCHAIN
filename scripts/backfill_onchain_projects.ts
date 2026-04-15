/**
 * Backfill script: imports on-chain ProjectAccounts into Supabase.
 * Reads all projects from Solana (IDs 0 to project_count-1) and 
 * upserts them into the projects table using the Service Role key.
 * 
 * Run: npx tsx scripts/backfill_onchain_projects.ts
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// ── Load env manually ──────────────────────────────────────────────────────
const envFile = fs.readFileSync('.env', 'utf-8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
  const [k, ...rest] = line.split('=');
  if (k && rest.length) env[k.trim()] = rest.join('=').trim();
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const PROGRAM_ID_STR = env['NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID'] || 'GcXxLjcCm7ov3i6QqQsL8zgjqiknWBswXn6jcwpEMYdC';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE env vars');
}

// ── Setup ──────────────────────────────────────────────────────────────────
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

// Load IDL from file
const idl = JSON.parse(fs.readFileSync('./programs/project_registry/src/idl.json', 'utf-8'));

const provider = new AnchorProvider(
  connection,
  { publicKey: PublicKey.default, signAllTransactions: async (t: any[]) => t, signTransaction: async (t: any) => t } as any,
  { commitment: 'confirmed' }
);
const program = new Program(idl as any, PROGRAM_ID, provider);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEFAULT_PUBKEY = PublicKey.default.toString();

// ── Map on-chain flags → Supabase status ──────────────────────────────────
function deriveStatus(account: any): string {
  const now = Math.floor(Date.now() / 1000);
  const subStart = (account.subscriptionStart as BN).toNumber();
  const subEnd   = (account.subscriptionEnd as BN).toNumber();
  const tokensIssued = (account.tokensIssued as BN).toNumber();
  const supplyCap    = (account.supplyCap as BN).toNumber();

  if (!account.isActive) return 'draft';
  if (account.mintAuthorityRevoked) return 'completed';
  if (tokensIssued >= supplyCap) return 'funded';
  if (now >= subStart && now <= subEnd) return 'funding';
  if (now > subEnd) return 'active';
  return 'draft';
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  // Get registry to know how many projects exist
  const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from('registry')], PROGRAM_ID);
  const registry = await program.account.registryConfig.fetch(registryPda) as any;
  const count = (registry.projectCount as BN).toNumber();

  console.log(`Found ${count} on-chain projects. Importing...`);

  let imported = 0;
  let skipped  = 0;

  for (let id = 0; id < count; id++) {
    const idBN = new BN(id);
    const [projectPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('project'), idBN.toArrayLike(Buffer, 'le', 8)],
      PROGRAM_ID
    );

    let account: any;
    try {
      account = await program.account.projectAccount.fetch(projectPda);
    } catch {
      console.log(`  [ID=${id}] Skipped — account not found`);
      skipped++;
      continue;
    }

    const name   = account.name as string;
    const symbol = account.symbol as string;
    const slug   = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${id}`;
    const status = deriveStatus(account);

    // Check if this project already has a DB row (match by blockchain_project_id)
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('blockchain_project_id', id)
      .maybeSingle();

    if (existing) {
      console.log(`  [ID=${id}] "${name}" already in DB (${existing.id}) — updating blockchain linkage & mint info`);
      await supabase.from('projects').update({
        blockchain_project_id: id,
        mint_address: account.mint.toString() !== DEFAULT_PUBKEY ? account.mint.toString() : null,
        mint_authority_revoked: account.mintAuthorityRevoked,
        status,
      }).eq('id', existing.id);
      skipped++;
      continue;
    }

    // Insert new row
    const supplyCap = (account.supplyCap as BN).toNumber();
    const minInv    = (account.minInvestmentUsdc as BN).toNumber();
    const maxInv    = (account.maxInvestmentUsdc as BN).toNumber();

    const { data, error } = await supabase.from('projects').insert({
      name,
      slug,
      description: `Imported from on-chain project #${id}. Token symbol: ${symbol}. URI: ${account.uri}`,
      location: 'On-Chain',
      country: 'Solana Devnet',
      funding_goal: Math.round(maxInv / 1_000_000),
      current_funding: 0,
      min_investment: Math.round(minInv / 1_000_000),
      token_price: supplyCap > 0 ? Math.round(maxInv / supplyCap / 1_000_000) || 1 : 1,
      total_tokens: supplyCap,
      available_tokens: supplyCap - (account.tokensIssued as BN).toNumber(),
      status,
      blockchain_project_id: id,
      mint_address: account.mint.toString() !== DEFAULT_PUBKEY ? account.mint.toString() : null,
      mint_authority_revoked: account.mintAuthorityRevoked,
      images: [],
      documents: [],
    }).select('id').single();

    if (error) {
      console.error(`  [ID=${id}] ERROR inserting "${name}":`, error.message);
    } else {
      console.log(`  [ID=${id}] ✓ Imported "${name}" → DB id=${data.id} (status=${status})`);
      imported++;
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped/Updated: ${skipped}`);
}

main().catch(console.error);

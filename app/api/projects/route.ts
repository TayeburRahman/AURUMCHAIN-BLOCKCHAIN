/**
 * API Route: Public Projects Listing
 * GET /api/projects
 *
 * Returns all publicly visible projects (funding, active, funded, completed).
 * Enriches each project with live on-chain data where available.
 * No authentication required — public read.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Connection } from '@solana/web3.js';
import { ProjectRegistryService } from '@/lib/web3/services/projectRegistryService';

function formatEnum(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.toLowerCase();
  // Anchor enum object like { mining: {} }
  const key = Object.keys(val)[0];
  return key ? key.toLowerCase() : '';
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch Supabase projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['funding', 'active', 'funded', 'completed', 'draft'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!projects || projects.length === 0) return NextResponse.json([]);

    // 2. Fetch on-chain project accounts individually (bypasses Alchemy's getProgramAccounts restriction)
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const service = new ProjectRegistryService(connection, {}); // Read-only mode
    
    const chainFetchPromises = projects
      .filter((p: any) => p.blockchain_project_id !== null)
      .map(async (p: any) => {
        try {
          const id = Number(p.blockchain_project_id);
          const account = await service.fetchProject(id);
          return { id, account };
        } catch (e) {
          console.warn(`[GET /api/projects] Failed to fetch on-chain data for project ${p.blockchain_project_id}:`, e);
          return { id: Number(p.blockchain_project_id), account: null };
        }
      });

    const chainResults = await Promise.all(chainFetchPromises);
    const chainMap = new Map();
    chainResults.forEach((res: any) => {
      if (res.account) {
        chainMap.set(res.id, res.account);
      }
    });


    // 3. Merge data
    const enriched = projects.map((project) => {
      const chainData = project.blockchain_project_id !== null 
        ? chainMap.get(project.blockchain_project_id) 
        : null;

      return {
        ...project,
        onChain: chainData ? {
          symbol:              chainData.symbol,
          uri:                 chainData.uri,
          supplyCap:           chainData.supplyCap.toNumber() / (10 ** (project.token_decimals || 9)),
          tokensIssued:        chainData.tokensIssued.toNumber() / (10 ** (project.token_decimals || 9)),
          minInvestmentUsdc:   chainData.minInvestmentUsdc.toNumber() / 1_000_000,
          maxInvestmentUsdc:   chainData.maxInvestmentUsdc.toNumber() / 1_000_000,
          acceptedStablecoin:  chainData.acceptedStablecoin.toString(),
          treasuryWallet:      chainData.treasuryWallet.toString(),
          mint:                chainData.mint.toString(),
          lockupEndTs:         chainData.lockupEndTs.toNumber(),
          subscriptionStart:   chainData.subscriptionStart.toNumber(),
          subscriptionEnd:     chainData.subscriptionEnd.toNumber(),
          createdAt:           chainData.createdAt.toNumber(),
          distributionCadence: chainData.distributionCadence,
          isActive:            chainData.status.active !== undefined,
          isPaused:            chainData.isPaused,
          mintAuthorityRevoked: chainData.mintAuthorityRevoked,
          creator:             chainData.creator.toString(),
          assetType:           formatEnum(chainData.assetType),
          status:              chainData.status,
          roundLimitTokens:    chainData.roundLimitTokens.toNumber() / (10 ** (project.token_decimals || 9)),
          currentRoundIssued:  chainData.currentRoundIssued.toNumber() / (10 ** (project.token_decimals || 9)),
          pda:                 '', 
        } : null,
      };
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error('[GET /api/projects] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

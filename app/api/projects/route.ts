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
import { createDefaultConnection } from '@/lib/web3/config/rpc';
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

    // 2. Fetch all on-chain project accounts in a single BATCH call (much faster, saves RPC limits)
    const connection = createDefaultConnection();
    const service = new ProjectRegistryService(connection, undefined); // Read-only mode
    
    const allOnChainProjects = await service.fetchAllProjects();
    const chainMap = new Map();
    
    allOnChainProjects.forEach((p: any) => {
      if (p && p.account) {
        chainMap.set(Number(p.account.projectId.toString()), p.account);
      }
    });


    // 3. Merge data
    const enriched = projects.map((project) => {
      try {
        const chainData = project.blockchain_project_id !== null 
          ? chainMap.get(Number(project.blockchain_project_id)) 
          : null;

        if (!chainData) return { ...project, onChain: null };

        // Helper for safe BN conversion (handles u64 > 2^53)
        const safeNum = (bn: any, decimals = 0) => {
          if (!bn) return 0;
          const s = bn.toString();
          return parseFloat(s) / (10 ** decimals);
        };

        const decimals = project.token_decimals || 9;

        return {
          ...project,
          onChain: {
            symbol:              chainData.symbol || '',
            uri:                 chainData.uri || '',
            supplyCap:           safeNum(chainData.supplyCap, decimals),
            tokensIssued:        safeNum(chainData.tokensIssued, decimals),
            minInvestmentUsdc:   safeNum(chainData.minInvestmentUsdc, 6),
            maxInvestmentUsdc:   safeNum(chainData.maxInvestmentUsdc, 6),
            acceptedStablecoin:  chainData.acceptedStablecoin?.toString() || '',
            treasuryWallet:      chainData.treasuryWallet?.toString() || '',
            mint:                chainData.mint?.toString() || '',
            lockupEndTs:         safeNum(chainData.lockupEndTs),
            subscriptionStart:   safeNum(chainData.subscriptionStart),
            subscriptionEnd:     safeNum(chainData.subscriptionEnd),
            createdAt:           safeNum(chainData.createdAt),
            distributionCadence: Number(chainData.distributionCadence || 0),
            isActive:            chainData.status?.active !== undefined,
            isPaused:            !!chainData.isPaused,
            mintAuthorityRevoked: !!chainData.mintAuthorityRevoked,
            creator:             chainData.creator?.toString() || '',
            assetType:           formatEnum(chainData.assetType),
            status:              chainData.status,
            roundLimitTokens:    safeNum(chainData.roundLimitTokens, decimals),
            currentRoundIssued:  safeNum(chainData.currentRoundIssued, decimals),
            pda:                 '', 
          }
        };
      } catch (err) {
        console.error(`[GET /api/projects] Enrichment failed for project ${project.id}:`, err);
        return { ...project, onChain: null }; // Fallback to DB-only data for this specific project
      }
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error('[GET /api/projects] CRITICAL FAILURE:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

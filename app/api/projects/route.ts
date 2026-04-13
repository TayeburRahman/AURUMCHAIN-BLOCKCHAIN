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
import { getProjectAccountsBulk } from '@/lib/solana/getProjectAccount';

export const dynamic = 'force-dynamic'; // Always fetch fresh data, never use static cache

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all publicly visible projects from Supabase
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['funding', 'active', 'funded', 'completed', 'draft'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/projects] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json([]);
    }

    // Collect all project IDs that have an associated on-chain account
    const chainProjectIds = projects
      .filter((p) => p.blockchain_project_id !== null && p.blockchain_project_id !== undefined)
      .map((p) => p.blockchain_project_id as number);

    // Bulk-fetch on-chain data in parallel (failures are silently null per project)
    const chainDataMap = chainProjectIds.length > 0
      ? await getProjectAccountsBulk(chainProjectIds)
      : new Map();

    // Merge Supabase + on-chain data
    const enriched = projects.map((project) => {
      const chainData = project.blockchain_project_id !== null && project.blockchain_project_id !== undefined
        ? chainDataMap.get(project.blockchain_project_id) ?? null
        : null;

      return {
        // ---- Supabase fields ----
        ...project,

        // ---- On-chain fields (null if not yet on chain) ----
        onChain: chainData ? {
          symbol:              chainData.symbol,
          uri:                 chainData.uri,
          supplyCap:           chainData.supplyCap,
          tokensIssued:        chainData.tokensIssued,
          minInvestmentUsdc:   chainData.minInvestmentUsdc,
          maxInvestmentUsdc:   chainData.maxInvestmentUsdc,
          acceptedStablecoin:  chainData.acceptedStablecoin,
          treasuryWallet:      chainData.treasuryWallet,
          mint:                chainData.mint,
          lockupEndTs:         chainData.lockupEndTs,
          subscriptionStart:   chainData.subscriptionStart,
          subscriptionEnd:     chainData.subscriptionEnd,
          distributionCadence: chainData.distributionCadence,
          isActive:            chainData.isActive,
          investmentsPaused:   chainData.investmentsPaused,
          transfersPaused:     chainData.transfersPaused,
          mintAuthorityRevoked: chainData.mintAuthorityRevoked,
          creator:             chainData.creator,
          pda:                 chainData.pda,
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

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

    // 2. Fetch all on-chain project accounts
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const service = new ProjectRegistryService(connection, {}); // Read-only mode
    const allOnChainProjects = await service.fetchAllProjects();

    // Map on-chain projects by their numeric ID for quick lookup
    const chainMap = new Map();
    allOnChainProjects.forEach((acc: any) => {
      chainMap.set(acc.account.projectId.toNumber(), acc.account);
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
          supplyCap:           chainData.supplyCap.toNumber(),
          tokensIssued:        chainData.tokensIssued.toNumber(),
          minInvestmentUsdc:   chainData.minInvestmentUsdc.toNumber(),
          maxInvestmentUsdc:   chainData.maxInvestmentUsdc.toNumber(),
          acceptedStablecoin:  chainData.acceptedStablecoin.toString(),
          treasuryWallet:      chainData.treasuryWallet.toString(),
          mint:                chainData.mint.toString(),
          lockupEndTs:         chainData.lockupEndTs.toNumber(),
          subscriptionStart:   chainData.subscriptionStart.toNumber(),
          subscriptionEnd:     chainData.subscriptionEnd.toNumber(),
          distributionCadence: chainData.distributionCadence,
          isActive:            chainData.isActive,
          investmentsPaused:   chainData.investmentsPaused,
          transfersPaused:     chainData.transfersPaused,
          mintAuthorityRevoked: chainData.mintAuthorityRevoked,
          creator:             chainData.creator.toString(),
          pda:                 '', // PDA can be derived if needed, but rarely used in public API
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

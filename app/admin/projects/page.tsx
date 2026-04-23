/**
 * Page: Admin Projects Management
 * Manage project listings - create, edit, delete projects
 */

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminService } from '@/lib/domains/admin/service';
import { Connection } from '@solana/web3.js';
import { ProjectRegistryService } from '@/lib/web3/services/projectRegistryService';
import ProjectsManagement from '@/components/admin/ProjectsManagement';

function formatEnum(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.toLowerCase();
  const key = Object.keys(val)[0];
  return key ? key.toLowerCase() : '';
}

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const isAdmin = await AdminService.isAdmin(user.id);
  if (!isAdmin) {
    redirect('/dashboard');
  }

  // 1. Fetch all projects from Supabase (using Admin Client to bypass RLS)
  const adminSupabase = createAdminClient();
  const { data: projectsData, error } = await adminSupabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  let enrichedProjects = projectsData || [];

  // 2. Fetch live on-chain status for each project
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const service = new ProjectRegistryService(connection, {}); // Read-only

    const onChainPromises = enrichedProjects
      .filter(p => p.blockchain_project_id !== null)
      .map(async (p) => {
        try {
          const chainData = await service.fetchProject(Number(p.blockchain_project_id));
          if (!chainData) return { id: p.id, onChain: null };
          
          const divisor = 10 ** (p.token_decimals || 9);
          
          return {
            id: p.id,
            onChain: {
              symbol:              chainData.symbol,
              uri:                 chainData.uri,
              supplyCap:           chainData.supplyCap.toNumber() / divisor,
              tokensIssued:        chainData.tokensIssued.toNumber() / divisor,
              minInvestmentUsdc:   chainData.minInvestmentUsdc.toNumber() / 1_000_000,
              maxInvestmentUsdc:   chainData.maxInvestmentUsdc.toNumber() / 1_000_000,
              currentRoundIssued:  chainData.currentRoundIssued.toNumber() / divisor,
              roundLimitTokens:    chainData.roundLimitTokens.toNumber() / divisor,
              isPaused:            chainData.isPaused,
              isActive:            !chainData.isPaused,
              assetType:           formatEnum(chainData.assetType),
              status:              chainData.status,
              acceptedStablecoin:  chainData.acceptedStablecoin.toString(),
              lockupEndTs:         chainData.lockupEndTs.toNumber(),
              treasuryWallet:      chainData.treasuryWallet.toString(),
              mint:                chainData.mint.toString(),
            }
          };
        } catch (e) {
          console.warn(`[AdminProjectsPage] Failed to fetch on-chain for ${p.id}:`, e);
          return { id: p.id, onChain: null };
        }
      });

    const onChainResults = await Promise.all(onChainPromises);
    const onChainMap = new Map(onChainResults.map(r => [r.id, r.onChain]));

    enrichedProjects = enrichedProjects.map(p => ({
      ...p,
      onChain: onChainMap.get(p.id) || null,
      // Keep top-level flags for legacy compatibility if needed
      is_paused: (onChainMap.get(p.id) as any)?.isPaused || false,
      is_active: (onChainMap.get(p.id) as any)?.isActive || false,
    }));
  } catch (err) {
    console.error('[AdminProjectsPage] Failed to fetch on-chain status:', err);
  }

  return (
    <div className="min-h-screen bg-navy pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Projects Management</h1>
              <p className="text-gray-400">Manage mining project listings</p>
            </div>
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <a
                href="/admin"
                className="px-4 py-2 glass rounded-lg border border-gold/20 text-gray-300 hover:text-gold transition-colors text-sm"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Projects Management Component */}
        <ProjectsManagement initialProjects={enrichedProjects as any} userId={user.id} />
      </div>
    </div>
  );
}

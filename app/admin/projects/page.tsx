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
          const account = await service.fetchProject(Number(p.blockchain_project_id));
          return { id: p.id, is_paused: account?.isPaused || false, is_active: account?.isActive || false };
        } catch (e) {
          return { id: p.id, is_paused: false, is_active: true };
        }
      });

    const onChainResults = await Promise.all(onChainPromises);
    const statusMap = new Map(onChainResults.map(r => [r.id, r]));

    enrichedProjects = enrichedProjects.map(p => ({
      ...p,
      is_paused: statusMap.get(p.id)?.is_paused || false,
      is_active: statusMap.get(p.id)?.is_active || false,
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

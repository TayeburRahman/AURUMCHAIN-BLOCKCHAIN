/**
 * Page: Admin Projects Management
 * Manage project listings - create, edit, delete projects
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminService } from '@/lib/domains/admin/service';
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

  // Fetch all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-navy pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Projects Management</h1>
              <p className="text-gray-400">Manage mining project listings</p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 glass rounded-lg border border-gold/20 text-gray-300 hover:text-gold transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Projects Management Component */}
        <ProjectsManagement initialProjects={projects || []} userId={user.id} />
      </div>
    </div>
  );
}

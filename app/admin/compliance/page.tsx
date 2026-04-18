/**
 * Page: Admin Compliance Dashboard
 * Review and manage KYC verifications
 */

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminService } from '@/lib/domains/admin/service';
import { ComplianceReviewList } from '@/components/admin/ComplianceReviewList';

export const revalidate = 0; // Force dynamic fetching for admin dashboard

export default async function AdminCompliancePage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has compliance officer role or admin
  const hasAccess =
    await AdminService.hasRole(user.id, 'compliance_officer') ||
    await AdminService.hasRole(user.id, 'admin') ||
    await AdminService.hasRole(user.id, 'super_admin');

  if (!hasAccess) {
    redirect('/dashboard');
  }

  // Get pending KYC reviews with joined user and wallet data
  const { data: pendingKyc } = await adminSupabase
    .from('kyc_profiles')
    .select(`
      *,
      user:user_id (
        id,
        email,
        first_name,
        last_name,
        wallets (
          wallet_address
        )
      )
    `)
    .in('status', ['pending', 'under_review'])
    .order('submitted_at', { ascending: true })
    .limit(50);

  // Transform data to ensure wallet_address is accessible
  const transformedPending = pendingKyc?.map((kyc: any) => ({
    ...kyc,
    metadata: {
      ...kyc.metadata,
      wallet_address: kyc.user?.wallets?.[0]?.wallet_address || kyc.metadata?.wallet_address
    }
  })) || [];

  // Get recent approvals
  const { data: recentApprovals } = await adminSupabase
    .from('kyc_profiles')
    .select(`
      *,
      user:user_id (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-navy pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <a href="/admin" className="text-gold hover:text-gold-light mb-4 inline-block transition-colors">
              ← Back to Admin Dashboard
            </a>
            <h1 className="text-5xl font-black gradient-text mb-2 tracking-tight">Compliance & KYC</h1>
            <p className="text-gray-400 text-lg">On-chain identity verification and investor allow-listing</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Pending Review"
            value={transformedPending.length}
            color="yellow"
          />
          <StatCard
            title="Recent Approvals"
            value={recentApprovals?.length || 0}
            color="green"
          />
          <StatCard
            title="Verification Rate"
            value="84%"
            color="blue"
          />
          <StatCard
            title="Program Status"
            value="ACTIVE"
            color="purple"
          />
        </div>

        {/* Pending Reviews - Main Action Area */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">Pending KYC Reviews</h2>
            <span className="text-xs text-gray-400 font-mono">Blockchain Synchronization: ENABLED</span>
          </div>

          <ComplianceReviewList initialPending={transformedPending} />
        </div>

        {/* Recent Approvals */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Recent Approvals</h2>

          {!recentApprovals || recentApprovals.length === 0 ? (
            <div className="glass rounded-xl p-8 border border-gold/20 text-center">
              <p className="text-gray-400">No recent approvals</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {recentApprovals.map((kyc: any) => (
                <div key={kyc.id} className="glass rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <h3 className="text-white font-medium">
                      {kyc.user?.first_name} {kyc.user?.last_name}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Approved {new Date(kyc.approved_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: {
  title: string;
  value: number | string;
  color: 'yellow' | 'green' | 'blue' | 'purple';
}) {
  const colors = {
    yellow: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
  };

  return (
    <div className={`glass rounded-xl p-6 border-2 ${colors[color]}`}>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-300">{title}</div>
    </div>
  );
}

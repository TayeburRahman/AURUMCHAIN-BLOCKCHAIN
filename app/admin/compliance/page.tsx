/**
 * Page: Admin Compliance Dashboard
 * Review and manage KYC verifications
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminService } from '@/lib/domains/admin/service';

export default async function AdminCompliancePage() {
  const supabase = await createClient();
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

  // Get pending KYC reviews
  const { data: pendingKyc } = await supabase
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
    .in('status', ['pending', 'under_review'])
    .order('submitted_at', { ascending: true })
    .limit(50);

  // Get recent approvals
  const { data: recentApprovals } = await supabase
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
    <div className="min-h-screen bg-navy pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/admin" className="text-gold hover:text-gold-light mb-4 inline-block">
            ← Back to Admin Dashboard
          </a>
          <h1 className="text-4xl font-bold gradient-text mb-2">Compliance & KYC</h1>
          <p className="text-gray-400">Review and manage identity verifications</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending Review"
            value={pendingKyc?.length || 0}
            color="yellow"
          />
          <StatCard
            title="Recent Approvals"
            value={recentApprovals?.length || 0}
            color="green"
          />
          <StatCard
            title="Avg Review Time"
            value="—"
            color="blue"
          />
          <StatCard
            title="Approval Rate"
            value="—"
            color="purple"
          />
        </div>

        {/* Pending Reviews */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Pending KYC Reviews</h2>

          {!pendingKyc || pendingKyc.length === 0 ? (
            <div className="glass rounded-xl p-8 border border-gold/20 text-center">
              <p className="text-gray-400">No pending KYC reviews</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingKyc.map((kyc: any) => (
                <div key={kyc.id} className="glass rounded-xl p-6 border border-gold/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {kyc.user?.first_name} {kyc.user?.last_name}
                        </h3>
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
                          {kyc.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-2">{kyc.user?.email}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <span className="text-gray-400">Provider ID:</span>
                          <p className="text-white font-mono text-xs">
                            {kyc.provider_applicant_id || '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Submitted:</span>
                          <p className="text-white">
                            {kyc.submitted_at
                              ? new Date(kyc.submitted_at).toLocaleDateString()
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Provider:</span>
                          <p className="text-white capitalize">{kyc.provider}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Nationality:</span>
                          <p className="text-white">{kyc.nationality || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors">
                        Approve
                      </button>
                      <button className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors">
                        Reject
                      </button>
                      <a
                        href={`/admin/compliance/${kyc.id}`}
                        className="bg-gold/20 text-gold px-4 py-2 rounded-lg hover:bg-gold/30 transition-colors"
                      >
                        Review
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

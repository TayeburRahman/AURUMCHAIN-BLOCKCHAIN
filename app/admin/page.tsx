/**
 * Page: Admin Dashboard
 * Protected admin-only area for platform management
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminService } from '@/lib/domains/admin/service';

export default async function AdminPage() {
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

  const roles = await AdminService.getUserRoles(user.id);

  return (
    <div className="min-h-screen bg-navy pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Platform management and oversight</p>

          <div className="flex gap-2 mt-4">
            {roles.map((role) => (
              <span
                key={role.id}
                className="inline-block bg-gold/20 text-gold px-3 py-1 rounded-full text-sm font-medium"
              >
                {role.role.replace(/_/g, ' ').toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value="—"
            icon="👥"
            description="All registered users"
          />
          <StatCard
            title="Pending KYC"
            value="—"
            icon="📋"
            description="Awaiting review"
          />
          <StatCard
            title="Active Investments"
            value="—"
            icon="💰"
            description="Total invested"
          />
          <StatCard
            title="Payouts This Month"
            value="—"
            icon="💸"
            description="Dividends distributed"
          />
        </div>

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Compliance Section */}
          <AdminSection
            title="Compliance & KYC"
            icon="🛡️"
            description="Review identity verifications"
            href="/admin/compliance"
            items={[
              'Pending KYC Reviews',
              'Approved Verifications',
              'Rejected Applications',
              'User Eligibility Status',
            ]}
          />

          {/* Projects Section */}
          <AdminSection
            title="Projects & Offerings"
            icon="⛏️"
            description="Manage mining projects"
            href="/admin/projects"
            items={[
              'Active Projects',
              'Token Offerings',
              'Funding Status',
              'Project Analytics',
            ]}
          />

          {/* Investments Section */}
          <AdminSection
            title="Investments"
            icon="📊"
            description="Track all investments"
            href="/admin/investments"
            items={[
              'Pending Investments',
              'Completed Investments',
              'Refund Requests',
              'Investment Analytics',
            ]}
          />

          {/* Payouts Section */}
          <AdminSection
            title="Payouts & Dividends"
            icon="💵"
            description="Manage dividend distribution"
            href="/admin/payouts"
            items={[
              'Create Payout Cycle',
              'Scheduled Payouts',
              'Payout History',
              'Unclaimed Dividends',
            ]}
          />

          {/* Audit Logs Section */}
          <AdminSection
            title="Audit Logs"
            icon="📝"
            description="View system activity"
            href="/admin/audit-logs"
            items={[
              'Recent Activity',
              'Security Events',
              'Admin Actions',
              'Compliance Changes',
            ]}
          />

          {/* User Management Section */}
          <AdminSection
            title="User Management"
            icon="⚙️"
            description="Manage users and roles"
            href="/admin/users"
            items={[
              'User Directory',
              'Role Assignments',
              'Account Status',
              'User Activity',
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description }: {
  title: string;
  value: string;
  icon: string;
  description: string;
}) {
  return (
    <div className="glass rounded-xl p-6 border border-gold/20">
      <div className="flex items-start justify-between mb-2">
        <div className="text-3xl">{icon}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function AdminSection({ title, icon, description, href, items }: {
  title: string;
  icon: string;
  description: string;
  href: string;
  items: string[];
}) {
  return (
    <div className="glass rounded-xl p-6 border border-gold/20 card-hover-lift">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
            {item}
          </li>
        ))}
      </ul>

      <a
        href={href}
        className="inline-block bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
      >
        Manage
      </a>
    </div>
  );
}

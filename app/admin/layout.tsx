import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminService } from '@/lib/domains/admin/service';
import AdminGuard from '@/components/admin/AdminGuard';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Initial Auth Check
  if (!user) {
    redirect('/login');
  }

  // 2. Server-side Role Check
  const isAdmin = await AdminService.isAdmin(user.id);
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}

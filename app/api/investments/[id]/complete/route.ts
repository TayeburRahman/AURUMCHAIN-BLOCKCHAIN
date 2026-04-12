/**
 * API Route: Complete investment (after payment)
 * POST /api/investments/[id]/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InvestmentsService } from '@/lib/domains/investments/service';
import { AdminService } from '@/lib/domains/admin/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can mark investments as completed)
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can complete investments' },
        { status: 403 }
      );
    }

    const { id: investmentId } = await params;

    // Complete investment
    const investment = await InvestmentsService.completeInvestment(investmentId);

    return NextResponse.json({
      success: true,
      investment,
    });
  } catch (error: any) {
    console.error('Investment completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete investment' },
      { status: 500 }
    );
  }
}

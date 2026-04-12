/**
 * API Route: Claim payout
 * POST /api/payouts/claim/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PayoutsService } from '@/lib/domains/payouts/service';

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

    const { id: payoutRecordId } = await params;

    // Claim payout
    const payoutRecord = await PayoutsService.claimPayout(payoutRecordId, user.id);

    return NextResponse.json({
      success: true,
      payoutRecord,
    });
  } catch (error: any) {
    console.error('Payout claim error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim payout' },
      { status: 500 }
    );
  }
}

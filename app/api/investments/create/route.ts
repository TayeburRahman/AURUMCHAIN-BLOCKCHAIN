/**
 * API Route: Create investment
 * POST /api/investments/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InvestmentsService } from '@/lib/domains/investments/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, offeringId, amount, tokensPurchased } = body;

    if (!projectId || !amount || !tokensPurchased) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create investment using service
    const investment = await InvestmentsService.createInvestment({
      userId: user.id,
      projectId,
      offeringId,
      amount: parseFloat(amount),
      tokensPurchased: parseFloat(tokensPurchased),
    });

    return NextResponse.json({
      success: true,
      investment,
    });
  } catch (error: any) {
    console.error('Investment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create investment' },
      { status: 500 }
    );
  }
}

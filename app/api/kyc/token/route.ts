/**
 * API Route: Get Sumsub Access Token
 * GET /api/kyc/token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SumsubClient } from '@/lib/sumsub/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate token for the logged-in user
    // levelName should match the flow configured in Sumsub dashboard
    const levelName = process.env.NEXT_PUBLIC_SUMSUB_LEVEL_NAME || 'basic-kyc-level';
    const tokenData = await SumsubClient.getAccessToken(user.id, levelName);

    return NextResponse.json(tokenData);
  } catch (error: any) {
    console.error('KYC token generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate KYC token' },
      { status: 500 }
    );
  }
}

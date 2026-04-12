/**
 * API Route: Verify wallet ownership
 * POST /api/wallet/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WalletService } from '@/lib/domains/wallet/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletLinkId, signature, message, nonce } = body;

    if (!walletLinkId || !signature || !message || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify wallet
    const walletLink = await WalletService.verifyWallet({
      walletLinkId,
      signature,
      message,
      nonce,
    });

    return NextResponse.json({
      success: true,
      walletLink,
    });
  } catch (error: any) {
    console.error('Wallet verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify wallet' },
      { status: 500 }
    );
  }
}

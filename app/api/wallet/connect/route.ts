/**
 * API Route: Connect wallet to user account
 * POST /api/wallet/connect
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
    const { walletAddress, chainId, walletType } = body;

    if (!walletAddress || !chainId) {
      return NextResponse.json(
        { error: 'Missing wallet address or chain ID' },
        { status: 400 }
      );
    }

    // Connect wallet
    const walletLink = await WalletService.connectWallet({
      userId: user.id,
      walletAddress,
      chainId,
      walletType,
    });

    return NextResponse.json({
      success: true,
      walletLink,
    });
  } catch (error: any) {
    console.error('Wallet connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect wallet' },
      { status: 500 }
    );
  }
}

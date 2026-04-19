import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WalletService } from '@/lib/domains/wallet/service';

/**
 * GET /api/wallet/active
 * Returns the currently active wallet link for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletLink = await WalletService.getActiveWallet(user.id);

    return NextResponse.json({
      success: true,
      walletLink,
      isVerified: walletLink?.verified || false
    });
  } catch (error: any) {
    console.error('Fetch active wallet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active wallet' },
      { status: 500 }
    );
  }
}

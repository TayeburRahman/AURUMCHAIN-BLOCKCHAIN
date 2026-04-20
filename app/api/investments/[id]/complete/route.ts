/**
 * API Route: Complete investment (after payment)
 * POST /api/investments/[id]/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InvestmentsService } from '@/lib/domains/investments/service';
import { AdminService } from '@/lib/domains/admin/service';
import { AdminBlockchainService } from '@/lib/web3/services/adminBlockchainService';


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

    // 1. Complete investment in Database
    const investment = await InvestmentsService.completeInvestment(investmentId);

    // 2. TRIGGER ON-CHAIN SETTLEMENT (AC-BC-406)
    let solanaSignature = null;
    if (investment.blockchainSubscriptionId && investment.investorWallet) {
      try {
        console.log(`[API] Triggering on-chain settlement for investment ${investmentId}...`);
        solanaSignature = await AdminBlockchainService.settleInvestment({
          subscriptionId: parseInt(investment.blockchainSubscriptionId),
          investor: investment.investorWallet,
          allocatedTokenAmount: Number(investment.tokensPurchased),
          paymentTxHash: investmentId, // Using DB ID as reference if no real hash exists
        });
        console.log(`[API] Settlement successful: ${solanaSignature}`);
      } catch (bcError: any) {
        console.error('[API] Blockchain settlement failed but DB was updated:', bcError);
        // We don't fail the whole request if DB succeeded, but we should log it
      }
    }

    return NextResponse.json({
      success: true,
      investment,
      solanaSignature,
    });

  } catch (error: any) {
    console.error('Investment completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete investment' },
      { status: 500 }
    );
  }
}

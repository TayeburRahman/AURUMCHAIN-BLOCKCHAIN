import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(req: NextRequest) {
  try {
    const { projectId, epochId, profitPerToken, txHash, dbProjectId, name, tokensEligible, totalAmount } = await req.json();

    if (!projectId || epochId === undefined || !profitPerToken || !dbProjectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[Indexer] Syncing Epoch ${epochId} for Project ${projectId}`);

    const { data, error } = await supabase
      .from('payout_cycles')
      .upsert({
        project_id: dbProjectId,
        epoch_id: epochId,
        profit_per_token: profitPerToken,
        amount_per_token: profitPerToken, // Fallback for legacy columns
        name: name || `Epoch ${epochId}`,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: totalAmount || 0,
        tokens_eligible: tokensEligible || 0, 
        scheduled_date: new Date().toISOString(),
        distribution_tx_hash: txHash,
        status: 'completed',
        calculated_at: new Date().toISOString()
      }, { onConflict: 'project_id, epoch_id' })
      .select()
      .single();

    if (error) {
      console.error("[Indexer] Supabase Upsert Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("[Indexer] Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

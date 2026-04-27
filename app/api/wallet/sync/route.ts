import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, amount, blockchainHash, description } = await request.json();

    if (!type || !amount || !blockchainHash) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Create a transaction record
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        type,
        status: 'completed',
        blockchain_hash: blockchainHash,
        blockchain_confirmed: true,
        description: description || `${type} confirmed on-chain`,
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update wallet balance if it's a deposit
    if (type === 'deposit') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      const newBalance = (wallet?.balance || 0) + parseFloat(amount);
      
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true, transaction: data });
  } catch (error: any) {
    console.error('Wallet sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

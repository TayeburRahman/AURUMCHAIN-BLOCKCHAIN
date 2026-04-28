"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function InvestorDistributionsPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch portfolio to get total earned
        const { data: portfolio } = await supabase
          .from('portfolio_positions')
          .select('total_dividends_received')
          .eq('user_id', user.id);
          
        if (portfolio) {
          const total = portfolio.reduce((acc, pos) => acc + (Number(pos.total_dividends_received) || 0), 0);
          setTotalEarned(total);
        }

        // Fetch payout records
        const { data: records } = await supabase
          .from('payout_records')
          .select('*, projects(name, symbol), payout_cycles(name)')
          .eq('user_id', user.id)
          .order('paid_at', { ascending: false });

        if (records) setPayouts(records);
        
      } catch (err) {
        console.error("Error fetching distributions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">My Distributions</h1>
        <p className="text-gray-400">Track your passive income and payout history from all projects.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-8 border border-gold/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">💰</div>
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Total Lifetime Earnings</h3>
          <div className="text-4xl font-black text-gold">${totalEarned.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC</div>
        </div>
        
        <div className="glass rounded-3xl p-8 border border-white/5">
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Total Payouts</h3>
          <div className="text-3xl font-black text-white">{payouts.length}</div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white">Payout History</h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl"></div>)}
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-5xl mb-4 opacity-20">💸</div>
            <h3 className="text-xl font-bold text-white mb-2">No Distributions Yet</h3>
            <p className="text-gray-500">You haven't received any payouts yet. Distributions will appear here automatically.</p>
            <Link href="/dashboard/investments" className="mt-6 inline-block px-6 py-2 border border-gold text-gold rounded-full hover:bg-gold/10 transition-colors font-bold text-sm uppercase tracking-widest">
              View Active Investments
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-widest bg-black/20">
                  <th className="p-6 font-bold">Date</th>
                  <th className="p-6 font-bold">Project</th>
                  <th className="p-6 font-bold">Epoch</th>
                  <th className="p-6 font-bold text-right">Tokens Held</th>
                  <th className="p-6 font-bold text-right">Amount Received</th>
                  <th className="p-6 font-bold text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="text-sm text-white font-medium">
                        {new Date(payout.paid_at || payout.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold text-white">
                        {payout.projects?.name} <span className="text-gray-500 font-normal">({payout.projects?.symbol})</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300 inline-block font-medium">
                        {payout.payout_cycles?.name || `Epoch #${payout.epoch_id}`}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-sm text-gray-400 font-mono">
                        {Number(payout.tokens_held).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-sm font-black text-green-400">
                        + ${Number(payout.amount_paid).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {payout.tx_hash ? (
                        <a 
                          href={`https://solscan.io/tx/${payout.tx_hash}?cluster=devnet`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          title="View on Explorer"
                        >
                          ↗
                        </a>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
}

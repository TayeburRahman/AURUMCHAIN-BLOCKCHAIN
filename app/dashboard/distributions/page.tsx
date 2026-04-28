"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { getDistributionProgram } from '@/lib/web3/utils/programDiscoverer';
import { PublicKey } from '@solana/web3.js';

export default function InvestorDistributionsPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const { investments: onChainInvestments } = useDashboardData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        let userId = user?.id;

        // If not logged in via session, try to find user by connected wallet
        if (!userId && publicKey) {
          const { data: link } = await supabase
            .from('wallet_links')
            .select('user_id')
            .eq('wallet_address', publicKey.toBase58())
            .maybeSingle();
          
          if (link) userId = link.user_id;
        }

        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch portfolio to get total earned
        const { data: portfolio } = await supabase
          .from('portfolio_positions')
          .select('total_dividends_received')
          .eq('user_id', userId);
          
        if (portfolio) {
          const total = portfolio.reduce((acc, pos) => acc + (Number(pos.total_dividends_received) || 0), 0);
          setTotalEarned(total);
        }

        // 1. Fetch DB Records (As secondary source/metadata)
        const { data: dbRecords } = await supabase
          .from('payout_records')
          .select(`
            *,
            projects(id, name, token_symbol),
            payout_cycles(name, profit_per_token)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // 2. Fetch On-Chain Records (PRIMARY SOURCE)
        let mergedRecords: any[] = dbRecords || [];
        
        if (publicKey) {
          try {
            console.log("[Payouts] Exhaustive Ledger Scan...");
            
            // 1. Fetch all accounts for the program to find PayoutRecords
            const accounts = await connection.getProgramAccounts(
              new PublicKey("9RqVyvWA4ficqK351PoYh674mP1au4NmNzVM6LQcenjm")
            );
            
            const userPayoutAccounts = accounts.filter(p => {
              const data = p.account.data;
              if (data.length !== 89) return false;
              const investor = new PublicKey(data.slice(40, 72)).toBase58();
              return investor === publicKey.toBase58();
            });

            // 2. Fetch parent Epochs for these payouts to get Project IDs
            const epochPubkeys = userPayoutAccounts.map(p => new PublicKey(p.account.data.slice(8, 40)));
            const epochAccounts = await connection.getMultipleAccountsInfo(epochPubkeys);
            
            userPayoutAccounts.forEach((p: any, idx: number) => {
              const data = p.account.data;
              const epochInfo = epochAccounts[idx];
              if (!epochInfo) return;

              // SNAPSHOT DATA: Correcting memory offsets
              // epoch_id is at 16, profit_per_token is at 24
              const blockchainProjectId = Number(epochInfo.data.readBigUInt64LE(8));
              const profitPerTokenBase = Number(epochInfo.data.readBigUInt64LE(24)) / 1_000_000; 
              const amountPaid = Number(data.readBigUInt64LE(72)) / 1_000_000;
              const timestamp = Number(data.readBigInt64LE(80));
              
              // MATH: tokens_held = total_payout / profit_per_token
              const snapshotTokens = profitPerTokenBase > 0 ? amountPaid / profitPerTokenBase : 0;

              const dbMatch = dbRecords?.find(r => 
                (Math.abs(Number(r.amount_due) - amountPaid) < 0.01)
              );

              if (!dbMatch) {
                const project = onChainInvestments?.find(inv => 
                  inv.projects?.blockchain_project_id?.toString() === blockchainProjectId.toString()
                )?.projects;

                mergedRecords.push({
                  id: p.pubkey.toBase58(),
                  is_on_chain: true,
                  project_id: project?.id,
                  projects: project || { name: `Project #${blockchainProjectId}`, token_symbol: "???" },
                  amount_due: amountPaid,
                  tokens_held: snapshotTokens, 
                  paid_at: new Date(timestamp * 1000).toISOString(),
                  tx_hash: "VERIFIED_ON_CHAIN",
                  payout_cycles: { name: `Epoch #${blockchainProjectId}` }
                });
              }
            });
          } catch (e) {
            console.error("[Payouts] Exhaustive Scan Error:", e);
          }
        }

        // 3. ENRICH AND DEDUPLICATE
        // We use a Map keyed by (project + amount + timestamp) to ensure absolute uniqueness
        const uniqueMap = new Map();
        mergedRecords.forEach(r => {
          const key = `${r.project_id}_${r.amount_due}_${new Date(r.paid_at).getTime() / 1000}`;
          if (!uniqueMap.has(key) || !r.is_on_chain) {
            uniqueMap.set(key, r);
          }
        });
        const finalUniqueRecords = Array.from(uniqueMap.values());

        const enrichedRecords = finalUniqueRecords.map(record => {
          // Source 1: Aggregate ALL on-chain investments for this project
          const totalInvestedForProject = onChainInvestments
            ?.filter(inv => 
              inv.project_id === record.project_id || 
              inv.projects?.id === record.project_id
            )
            .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;

          // Source 2: Calculate Epoch-Wise Net Profit (As requested)
          // Formula: (Payout Amount for this Epoch) - (Total Invested for this Project)
          const epochWiseNetProfit = Number(record.amount_due) - totalInvestedForProject;

          return { 
            ...record, 
            totalInvestedForProject, 
            epochWiseNetProfit 
          };
        });

        if (enrichedRecords) setPayouts(enrichedRecords);
        
      } catch (err) {
        console.error("Error fetching distributions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
  }, [publicKey, onChainInvestments]);

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
                  <th className="p-6 font-bold text-right">Invested</th>
                  <th className="p-6 font-bold text-right">Tokens Held</th>
                  <th className="p-6 font-bold text-right">Payout</th>
                  <th className="p-6 font-bold text-right">Net Profit</th>
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
                        {payout.projects?.name} <span className="text-gray-500 font-normal">({payout.projects?.token_symbol})</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300 inline-block font-medium">
                        {payout.payout_cycles?.name || `Epoch #${payout.epoch_id}`}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-sm text-gray-400">
                        ${Number(payout.totalInvestedForProject || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-sm text-white font-mono">
                        {Number(payout.tokens_held).toLocaleString()} <span className="text-gold text-[10px] ml-1">{payout.projects?.token_symbol}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-sm font-black text-white">
                        ${Number(payout.amount_due).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className={`text-sm font-bold ${payout.epochWiseNetProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {payout.epochWiseNetProfit >= 0 ? '+' : '-'} ${Math.abs(payout.epochWiseNetProfit).toLocaleString(undefined, {minimumFractionDigits: 2})}
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

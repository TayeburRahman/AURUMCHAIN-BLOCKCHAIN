"use client";

import { useEffect, useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { BN, Program, AnchorProvider } from '@coral-xyz/anchor';
import Link from 'next/link';
import { InvestmentRepository } from '@/lib/web3/repositories/investmentRepository';
import { ProjectRegistryService } from '@/lib/web3/services/projectRegistryService';
import { createDefaultConnection } from '@/lib/web3/config/rpc';
import { getRegistryPDA, getProjectPDA, getMintAuthorityPDA, getSubscriptionPDA, getComplianceControlPDA } from '@/lib/web3/utils/pdaHelpers';
import { getComplianceProgram } from '@/lib/web3/utils/programDiscoverer';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

export default function AdminInvestmentsPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [unifiedInvestments, setUnifiedInvestments] = useState<any[]>([]);
  const [projects, setProjects] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Derive repo/services
  const { repo, registryService } = useMemo(() => {
    if (!wallet.publicKey) return { repo: null, registryService: null };
    
    const program = getComplianceProgram(connection, wallet);
    
    // We need the registry program ID from environment
    const registryId = new PublicKey(process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID || "");
    
    return {
      repo: new InvestmentRepository(program, registryId),
      registryService: new ProjectRegistryService(connection, wallet)
    };
  }, [connection, wallet]);

  const fetching = useMemo(() => ({ active: false }), []);

  const fetchData = async () => {
    if (!repo || !registryService || fetching.active) return;
    
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      fetching.active = true;
      setLoading(true);
      
      const [allSubs, allProjects, { data: dbProjects }, { data: dbInvestments }] = await Promise.all([
        repo.fetchAll(),
        registryService.fetchAllProjects(),
        supabase.from('projects').select('id, blockchain_project_id, name, images, token_symbol, token_price'),
        supabase.from('investments').select('*, projects!inner(id, blockchain_project_id, name, images, token_symbol, token_price), profiles!inner(id, crypto_wallet_address)').order('created_at', { ascending: false })
      ]);

      // Map projects by ID for quick lookup
      const projectMap: Record<string, any> = {};
      allProjects.forEach((p: any) => {
        if (p && p.account) {
          const blockchainId = p.account.projectId.toString();
          // Find matching DB record to get the UUID
          const dbMatch = dbProjects?.find(db => db.blockchain_project_id?.toString() === blockchainId);
          
          projectMap[blockchainId] = {
            ...p.account,
            id: dbMatch?.id,
            dbName: dbMatch?.name,
            images: dbMatch?.images,
            tokenSymbol: dbMatch?.token_symbol
          };
        }
      });

      // Unify DB investments with On-Chain Subscriptions
      const unified: any[] = [];
      const usedSubIds = new Set();

      (dbInvestments || []).forEach((dbInv: any) => {
        const onChainSub = allSubs.find((s: any) => 
          s.account.subscriptionId.toString() === dbInv.offering_id || 
          (s.account.projectId.toString() === dbInv.projects?.blockchain_project_id && 
           Number(s.account.investmentAmount.toString()) / 1_000_000 === Number(dbInv.amount))
        );
        
        if (onChainSub) usedSubIds.add(onChainSub.publicKey.toBase58());
        
        unified.push({
          id: dbInv.id,
          dbStatus: dbInv.status,
          amountUsdc: Number(dbInv.amount),
          tokensExpected: Number(dbInv.tokens_purchased),
          txHash: dbInv.transaction_hash,
          date: dbInv.created_at,
          projectId: dbInv.project_id,
          projectName: dbInv.projects?.name,
          logo: dbInv.projects?.images?.[0] || null,
          tokenSymbol: dbInv.projects?.token_symbol || 'TOKEN',
          investorWallet: dbInv.profiles?.crypto_wallet_address || (onChainSub ? onChainSub.account.investor.toBase58() : 'Unknown Wallet'),
          onChainSub: onChainSub || null
        });
      });

      // Add any on-chain subs that are NOT in DB yet (fallback)
      allSubs.forEach((sub: any) => {
        if (!usedSubIds.has(sub.publicKey.toBase58())) {
          const pidStr = sub.account.projectId.toString();
          const projectData = projectMap[pidStr];
          const amount = Number(sub.account.investmentAmount.toString()) / 1_000_000;
          let tokensExp = 0;
          
          // Try to estimate tokens expected if price is known
          if (projectData && projectData.tokenPriceUsdc) {
            const price = Number(projectData.tokenPriceUsdc.toString()) / 1_000_000;
            if (price > 0) tokensExp = amount / price;
          }

          // Check if the on-chain subscription is pending or already allocated
          const isOnChainPending = sub.account.status.pending !== undefined;

          unified.push({
            id: sub.publicKey.toBase58(),
            dbStatus: isOnChainPending ? 'pending' : 'approved',
            amountUsdc: amount,
            tokensExpected: tokensExp,
            txHash: null,
            date: new Date().toISOString(),
            projectId: pidStr,
            projectName: projectData?.dbName || projectData?.name || `Project #${pidStr}`,
            logo: projectData?.images?.[0] || null,
            tokenSymbol: projectData?.tokenSymbol || 'TOKEN',
            investorWallet: sub.account.investor.toBase58(),
            onChainSub: sub
          });
        }
      });

      setUnifiedInvestments(unified);
      setProjects(projectMap);
      console.log("✅ Unified Investments:", unified);
    } catch (err: any) {
      if (err.message?.includes('429')) {
        console.warn("RPC Rate limited (429). Throttling...");
      } else {
        console.error("Fetch Error:", err);
        setStatus({ type: 'error', msg: "Failed to load investments." });
      }
    } finally {
      setLoading(false);
      fetching.active = false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [repo]);

  const handleFinalize = async (sub: any) => {
    if (!repo || !wallet.publicKey || !connection) return;
    
    const projectId = sub.account.projectId;
    const amountUsdc = Number(sub.account.investmentAmount.toString()) / 1_000_000;
    const investorAddr = sub.account.investor.toBase58();

    // 1. AUTOMATION: Try to find the matching investment in Supabase FIRST
    let autoTxHash = null;
    let autoTokenAmount = null;
    
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const pidStr = projectId.toString();
      const projectRecord = projects[pidStr];
      
      if (projectRecord) {
        let { data: dbInv } = await supabase
          .from('investments')
          .select('transaction_hash, tokens_purchased')
          .eq('offering_id', sub.account.subscriptionId.toString())
          .maybeSingle(); // Avoid 406 error if not found
        
        if (!dbInv && projectRecord.id) {
          const { data: fallbackInv } = await supabase
            .from('investments')
            .select('transaction_hash, tokens_purchased')
            .eq('amount', amountUsdc)
            .eq('project_id', projectRecord.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          dbInv = fallbackInv;
        }
        
        if (dbInv) {
          if (dbInv.transaction_hash && dbInv.transaction_hash.length > 20) {
            autoTxHash = dbInv.transaction_hash;
          }
          if (dbInv.tokens_purchased) {
            autoTokenAmount = dbInv.tokens_purchased.toString();
          }
        }
      }
    } catch (e) {
      console.warn("[Admin] Supabase match failed, trying blockchain scan...");
    }

    // 2. BLOCKCHAIN SCANNER: If no hash found in DB, scan the chain for the USDC transfer
    if (!autoTxHash) {
      try {
        console.log(`[Admin] Precise scanning for payment from ${investorAddr} to treasury...`);
        const investorPK = new PublicKey(investorAddr);
        const pidStr = projectId.toString();
        const projectRecord = projects[pidStr];
        const treasuryAddr = projectRecord.treasuryWallet?.toBase58();
        
        if (treasuryAddr) {
          // Precise scanning with global resilient connection
          console.log(`[Admin] Precise scanning for payment from ${investorAddr} to treasury...`);
          const sigs = await connection.getSignaturesForAddress(investorPK, { limit: 20 });
          
          for (const sigInfo of sigs) {
            const tx = await connection.getParsedTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0,
            });
            
            if (!tx) continue;

            const message = tx.transaction.message;
            const accounts = (message as any).accountKeys.map((k: any) => k.pubkey?.toBase58() || k.toBase58());
            
            if (accounts.includes(treasuryAddr)) {
              console.log(`[Admin] Found matching transaction signature: ${sigInfo.signature}`);
              autoTxHash = sigInfo.signature;
              break; 
            }
          }
        }
      } catch (e) {
        console.error("[Admin] Blockchain scan failed:", e);
      }
    }

    const txHashInput = autoTxHash || window.prompt("Enter Settlement Transaction Hash (64 bytes hex or string):");
    if (!txHashInput) return;

    // Default to the invested USDC amount formatted as human readable if no tokens found
    let defaultAmount = (amountUsdc).toString();
    
    // 3. AUTO-CALCULATE TOKEN AMOUNT: If not in DB, calculate based on on-chain price
    if (!autoTokenAmount) {
      const pidStr = projectId.toString();
      const projectRecord = projects[pidStr];
      if (projectRecord?.tokenPriceUsdc) {
        const price = Number(projectRecord.tokenPriceUsdc.toString()) / 1_000_000;
        if (price > 0) {
          autoTokenAmount = (amountUsdc / price).toString();
          console.log(`[Admin] Auto-calculated token amount: ${autoTokenAmount} (Price: ${price})`);
        }
      }
    }

    const tokenAmountInput = autoTokenAmount || window.prompt("Enter Token Amount to Issue (e.g. 1200.5):", defaultAmount);
    if (!tokenAmountInput) return;

    try {
      setSubmitting(sub.publicKey.toBase58());
      setStatus({ type: 'info', msg: "Preparing finalization transaction..." });

      const projectId = sub.account.projectId;
      const pidStr = projectId.toString();
      
      console.log("🔍 Finalizing Project ID:", pidStr);
      console.log("📂 Current Project Keys in State:", Object.keys(projects));

      const projectData = projects[pidStr];
      if (!projectData) {
        console.error("❌ Project Lookup Failed for ID:", pidStr);
        throw new Error(`Project data not found in registry for ID: ${pidStr}`);
      }

      if (!projectData.mint || projectData.mint.toBase58() === PublicKey.default.toBase58()) {
        throw new Error("This project has no SPL Token Mint linked yet. Please create a mint first.");
      }

      // Get real decimals from the mint, fallback to Supabase value, then 9
      const mintInfo = await connection.getParsedAccountInfo(projectData.mint);
      const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals ?? projectData.token_decimals ?? 9;

      // Scale up the human input to BN base units
      const amountFloat = parseFloat(tokenAmountInput);
      const amountBN = new BN(Math.floor(amountFloat * Math.pow(10, decimals)));

      // Convert txHash to [u8; 64]
      const txHashBytes = new Uint8Array(64);
      const inputBytes = Buffer.from(txHashInput);
      txHashBytes.set(inputBytes.slice(0, 64));

      const registryId = new PublicKey(process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID || "");
      const investorTokenAccount = await getAssociatedTokenAddress(projectData.mint, sub.account.investor);

      console.log("Finalizing with accounts:", {
        subscription: getSubscriptionPDA(sub.account.investor, sub.account.subscriptionId, repo['program'].programId).toBase58(),
        control: getComplianceControlPDA(repo['program'].programId).toBase58(),
        authority: wallet.publicKey.toBase58(),
        projectRegistryProgram: registryId.toBase58(),
        registryControl: getRegistryPDA(registryId).toBase58(),
        registryProject: getProjectPDA(projectId, registryId).toBase58(),
        mint: projectData.mint.toBase58(),
        investorTokenAccount: investorTokenAccount.toBase58(),
        mintAuthorityPda: getMintAuthorityPDA(projectId, registryId).toBase58(),
        tokenProgram: TOKEN_PROGRAM_ID.toBase58()
      });

      const { createAssociatedTokenAccountIdempotentInstruction, ASSOCIATED_TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        investorTokenAccount,
        sub.account.investor,
        projectData.mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const finalizeIx = await repo['program'].methods
        .finalizeSubscription(Array.from(txHashBytes), amountBN)
        .accounts({
          subscription: getSubscriptionPDA(sub.account.investor, sub.account.subscriptionId, repo['program'].programId),
          control: getComplianceControlPDA(repo['program'].programId),
          authority: wallet.publicKey,
          projectRegistryProgram: registryId,
          registryControl: getRegistryPDA(registryId),
          registryProject: getProjectPDA(projectId, registryId),
          mint: projectData.mint,
          investorTokenAccount: investorTokenAccount,
          mintAuthorityPda: getMintAuthorityPDA(projectId, registryId),
          tokenProgram: TOKEN_PROGRAM_ID
        } as any)
        .instruction();

      const { Transaction } = await import('@solana/web3.js');
      const transaction = new Transaction().add(createAtaIx, finalizeIx);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const tx = await wallet.sendTransaction(transaction, connection);

      setStatus({ type: 'success', msg: `Investment Finalized! ${tokenAmountInput} tokens issued. Sig: ${tx.slice(0, 10)}...` });
      fetchData();
    } catch (err: any) {
      console.error("Finalize Error:", err);
      setStatus({ type: 'error', msg: err.message || "Finalization failed." });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <Link href="/admin" className="text-gold hover:text-white transition-colors flex items-center gap-2 mb-4 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
            </Link>
            <h1 className="text-5xl font-black gradient-text mb-2 tracking-tight">Investment Requests</h1>
            <p className="text-gray-400">Verify payments and authorize token issuance for pending subscriptions.</p>
          </div>
          <button 
            onClick={fetchData}
            className="p-3 rounded-xl border border-gold/20 hover:bg-gold/10 transition-all text-gold"
            title="Refresh Data"
          >
            🔄
          </button>
        </div>

        {status && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${
            status.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
            status.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
            'bg-gold/10 text-gold border-gold/30'
          }`}>
            <span className="text-xl">{status.type === 'error' ? '❌' : status.type === 'success' ? '✅' : '⏳'}</span>
            <p className="font-medium">{status.msg}</p>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'pending' ? 'bg-gold text-navy' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending ({unifiedInvestments.filter(i => i.dbStatus === 'pending').length})
          </button>
          <button 
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'approved' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Approved ({unifiedInvestments.filter(i => i.dbStatus === 'approved').length})
          </button>
          <button 
            onClick={() => setActiveTab('rejected')}
            className={`px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'rejected' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Rejected ({unifiedInvestments.filter(i => i.dbStatus === 'rejected').length})
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 glass animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : unifiedInvestments.filter(inv => inv.dbStatus === activeTab).length === 0 ? (
          <div className="glass rounded-3xl p-20 text-center border border-white/5">
            <div className="text-6xl mb-6 opacity-20">💰</div>
            <h3 className="text-2xl font-bold text-white mb-2">No {activeTab} Investments Found</h3>
            <p className="text-gray-400">There are no investment requests matching this status.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {unifiedInvestments
              .filter(inv => inv.dbStatus === activeTab)
              .sort((a, b) => {
                // Pending -> FIFO (oldest first)
                if (activeTab === 'pending') {
                  return new Date(a.date).getTime() - new Date(b.date).getTime();
                }
                // Approved / Rejected -> Newest first
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              })
              .map((inv) => {
              const sub = inv.onChainSub;
              const isPending = inv.dbStatus === 'pending';
              const isApproved = inv.dbStatus === 'approved';
              const isRejected = inv.dbStatus === 'rejected';
              
              return (
                <div key={inv.id} className={`glass rounded-2xl border transition-all overflow-hidden ${isPending ? 'border-gold/30' : isApproved ? 'border-green-500/30' : 'border-red-500/30 opacity-60'}`}>
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-6 items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl overflow-hidden ${isPending ? 'bg-gold/20 text-gold' : isApproved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {inv.logo ? <img src={inv.logo} alt="Logo" className="w-full h-full object-cover" /> : (isPending ? "⏳" : isApproved ? "✅" : "❌")}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                            {inv.projectName} <span className="text-sm font-medium text-gray-500">({inv.tokenSymbol})</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isPending ? 'bg-gold/20 text-gold' : isApproved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {inv.dbStatus}
                          </span>
                        </div>
                        <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                          <span>Investor Wallet: {inv.investorWallet}</span>
                          <span>Expected Tokens: {inv.tokensExpected.toLocaleString()} {inv.tokenSymbol}</span>
                          {inv.txHash && (
                            <span className="text-amber-600/60 mt-1">
                              Tx: <a href={`https://solscan.io/tx/${inv.txHash}?cluster=devnet`} target="_blank" className="hover:text-amber-400 underline">{inv.txHash}</a>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">
                          {inv.amountUsdc.toLocaleString()} USDC
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(inv.date).toLocaleDateString()}</div>
                      </div>

                      {isPending && sub && (
                        <button
                          onClick={() => handleFinalize(sub)}
                          disabled={submitting !== null}
                          className="px-8 py-3 rounded-xl bg-gold text-navy font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                          {submitting === sub.publicKey.toBase58() ? "Verifying..." : "Verify & Issue"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .gradient-text {
          background: linear-gradient(to right, #D4AF37, #F5E0A3, #B8860B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  );
}

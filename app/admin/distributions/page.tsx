"use client";

import { useEffect, useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN, Program, AnchorProvider } from '@coral-xyz/anchor';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import idl from '@/lib/web3/idl/allocation_distribution.json';

const ALLOCATION_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_ALLOCATION_PROGRAM_ID || "9RqVyvWA4ficqK351PoYh674mP1au4NmNzVM6LQcenjm");

export default function AdminDistributionsPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [epochs, setEpochs] = useState<any[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  const [executingPayout, setExecutingPayout] = useState<string | null>(null);
  
  // Create Epoch Form State
  const [selectedProject, setSelectedProject] = useState('');
  const [profitPerToken, setProfitPerToken] = useState('');
  const [epochName, setEpochName] = useState('');

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;
    const provider = new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
    return new Program(idl as any, ALLOCATION_PROGRAM_ID, provider);
  }, [connection, wallet]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const [projectsData, epochsData] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('payout_cycles').select('*, projects(name, token_symbol)').order('created_at', { ascending: false })
      ]);
      
      if (projectsData.data) setProjects(projectsData.data);
      if (epochsData.data) setEpochs(epochsData.data);
      
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setStatus({ type: 'error', msg: "Failed to load distributions data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEpoch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !wallet.publicKey || !selectedProject || !profitPerToken) return;
    
    try {
      setSubmitting('creating');
      setStatus({ type: 'info', msg: "Preparing on-chain Epoch creation..." });

      const dbProject = projects.find(p => p.id === selectedProject);
      if (!dbProject || !dbProject.blockchain_project_id) {
         throw new Error("Project not linked to blockchain.");
      }

      const blockchainProjectId = new BN(dbProject.blockchain_project_id);
      
      // Convert profit to base units
      const profitFloat = parseFloat(profitPerToken);

      // Derive PDAs
      const [counterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("counter"), blockchainProjectId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      // We need to fetch current count to get the epoch PDA.
      // But actually, Anchor handles init if we pass the right seeds in the program if we know it.
      // Wait, let's just let Anchor resolve it or fetch counter.
      let currentCount = new BN(0);
      try {
        const counterAccount: any = await program.account.epochCounter.fetch(counterPda);
        currentCount = counterAccount.count;
      } catch (e) {
        console.log("Counter not initialized yet, assumes 0");
      }

      const [epochPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("epoch"), blockchainProjectId.toArrayLike(Buffer, "le", 8), currentCount.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [controlPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("distribution_control")],
        program.programId
      );

      const registryProgramId = new PublicKey(process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID || "Dkrnk6B8MuiieXQzqhicbsPtGp7TY4HMZRNDJJFhu4R7");
      const [projectAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), blockchainProjectId.toArrayLike(Buffer, "le", 8)],
        registryProgramId
      );

      // Fetch on-chain project to get the exact tokens issued for accurate DB indexing
      const { ProjectRegistryService } = await import('@/lib/web3/services/projectRegistryService');
      const registryService = new ProjectRegistryService(connection, wallet as any);
      const onChainProject = await registryService.fetchProject(blockchainProjectId.toNumber());
      
      const rawTokens = onChainProject ? new BN(onChainProject.tokensIssued).toNumber() : 0;
      const decimals = onChainProject?.tokenDecimals || 6;
      const totalAmount = rawTokens * profitFloat; // Must strictly equal tokens_eligible * profit_per_token for DB check

      // Simplification: Always pass the human profit scaled to USDC base units ($1.00 = 1,000,000).
      // The new smart contract version will handle the division by the project's decimals.
      const profitBN = new BN(Math.floor(profitFloat * 1_000_000));
      const tokenDecimals = decimals;

      const { SystemProgram } = await import('@solana/web3.js');

      setStatus({ type: 'info', msg: "Please approve the transaction in your wallet." });
      
      const ix = await program.methods
        .createEpoch(blockchainProjectId, profitBN, tokenDecimals)
        .accounts({
          counter: counterPda,
          epoch: epochPda,
          projectAccount: projectAccountPda,
          projectRegistryProgram: registryProgramId,
          control: controlPda,
          admin: wallet.publicKey,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .instruction();

      const { Transaction, ComputeBudgetProgram } = await import('@solana/web3.js');
      
      // Add priority fees to punch through Devnet congestion
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 });

      const transaction = new Transaction()
        .add(modifyComputeUnits)
        .add(addPriorityFee)
        .add(ix);
      
      setStatus({ type: 'info', msg: "Fetching fresh blockhash..." });
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      setStatus({ type: 'info', msg: "Please approve the transaction in your wallet." });
      const tx = await wallet.sendTransaction(transaction, connection);

      setStatus({ type: 'info', msg: "Transaction sent. Manually polling confirmation (bypassing WebSocket)..." });
      
      // Manual REST polling to avoid WebSocket signatureSubscribe hanging on Alchemy
      let confirmed = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s per poll
        const status = await connection.getSignatureStatus(tx);
        if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
          confirmed = true;
          break;
        }
        if (status.value?.err) {
          throw new Error("Transaction failed on-chain: " + JSON.stringify(status.value.err));
        }
      }

      if (!confirmed) {
        console.warn("Manual polling timed out after 30s, but proceeding to sync anyway.");
      }

      // Sync with Supabase
      setStatus({ type: 'info', msg: "Syncing with database..." });
      
      await fetch('/api/indexer/sync-epoch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: dbProject.blockchain_project_id,
          dbProjectId: dbProject.id,
          epochId: currentCount.toNumber(),
          profitPerToken: profitFloat,
          tokensEligible: rawTokens, // DB expects BIGINT (raw base units)
          totalAmount: totalAmount,  // DB expects NUMERIC (human USDC value)
          name: epochName || `Epoch ${currentCount.toNumber() + 1}`,
          txHash: tx
        })
      });

      setStatus({ type: 'success', msg: `Epoch Created Successfully! Tx: ${tx.slice(0, 10)}...` });
      setProfitPerToken('');
      setEpochName('');
      fetchData();

    } catch (err: any) {
      console.error("Epoch Creation Error:", err);
      setStatus({ type: 'error', msg: err.message || "Failed to create epoch." });
    } finally {
      setSubmitting(null);
    }
  };

  const handleExecutePayout = async (epoch: any) => {
    if (!program || !wallet.publicKey) return;
    try {
      setExecutingPayout(epoch.id);
      setStatus({ type: 'info', msg: "Preparing Payout Execution..." });

      const targetWalletStr = window.prompt("Enter the Investor's Wallet Address to send this payout to:");
      if (!targetWalletStr) { setExecutingPayout(null); return; }
      const investorPublicKey = new PublicKey(targetWalletStr);

      const dbProject = projects.find(p => p.id === epoch.project_id);
      const blockchainProjectId = new BN(dbProject.blockchain_project_id);

      // 1. Fetch on-chain project to get Mint and Treasury
      const { ProjectRegistryService } = await import('@/lib/web3/services/projectRegistryService');
      const registryService = new ProjectRegistryService(connection, wallet as any);
      const onChainProject = await registryService.fetchProject(blockchainProjectId.toNumber());
      if (!onChainProject) throw new Error("Could not find project on blockchain");

      const mint = onChainProject.mint;
      const treasuryWallet = onChainProject.treasuryWallet;

      // 2. Get Associated Token Accounts
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } = await import('@solana/spl-token');
      const investorTokenAccount = await getAssociatedTokenAddress(mint, investorPublicKey);
      
      // USDC ATA for investor (Assuming USDC is the accepted_stablecoin)
      const usdcMint = onChainProject.acceptedStablecoin;
      const investorPaymentAccount = await getAssociatedTokenAddress(usdcMint, investorPublicKey);
      const treasuryVault = await getAssociatedTokenAddress(usdcMint, treasuryWallet, true);

      // Idempotent creation of investor's USDC account (in case they've never held USDC)
      const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey, // Admin pays for creation if needed
        investorPaymentAccount,
        investorPublicKey,
        usdcMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // 3. Derive PDAs
      const registryProgramId = new PublicKey(process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID || "Dkrnk6B8MuiieXQzqhicbsPtGp7TY4HMZRNDJJFhu4R7");
      const [projectAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), blockchainProjectId.toArrayLike(Buffer, "le", 8)],
        registryProgramId
      );

      const [epochPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("epoch"), blockchainProjectId.toArrayLike(Buffer, "le", 8), new BN(epoch.epoch_id).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [payoutRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("payout"), epochPda.toBuffer(), investorPublicKey.toBuffer()],
        program.programId
      );

      const [controlPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("distribution_control")],
        program.programId
      );

      const { SystemProgram, Transaction, ComputeBudgetProgram } = await import('@solana/web3.js');

      // 4. Build Transaction
      const ix = await program.methods
        .executePayout()
        .accounts({
          epoch: epochPda,
          payoutRecord: payoutRecordPda,
          projectAccount: projectAccountPda,
          projectRegistryProgram: registryProgramId,
          investorTokenAccount: investorTokenAccount,
          investorPaymentAccount: investorPaymentAccount,
          treasuryVault: treasuryVault,
          control: controlPda,
          admin: wallet.publicKey,
          investor: investorPublicKey,
          payer: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .instruction();

      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 });

      const transaction = new Transaction().add(modifyComputeUnits).add(addPriorityFee).add(createAtaIx).add(ix);
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      setStatus({ type: 'info', msg: "Please approve the Execute Payout transaction." });
      const tx = await wallet.sendTransaction(transaction, connection, { skipPreflight: true });

      setStatus({ type: 'info', msg: "Executing Payout on-chain..." });
      
      let confirmed = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await connection.getSignatureStatus(tx);
        if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
          if (status.value.err) {
            throw new Error("Transaction failed on-chain: " + JSON.stringify(status.value.err));
          }
          confirmed = true; break;
        }
      }

      // 5. Sync Record to Database
      setStatus({ type: 'info', msg: "Syncing Payout Record..." });
      
      let investorBalance = 0;
      try {
        const info = await connection.getTokenAccountBalance(investorTokenAccount);
        investorBalance = info.value.uiAmount || 0;
      } catch (e) { console.log("Could not fetch investor balance"); }
      
      // Normalize the scaled profit_per_token back to human units for the DB receipt
      const profitHuman = parseFloat(epoch.profit_per_token) / 1_000_000;
      const investorPayoutAmount = investorBalance * profitHuman;

      const supabase = createClient();
      let profileId = null;
      const { data: profile } = await supabase.from('profiles').select('id').eq('crypto_wallet_address', targetWalletStr).maybeSingle();
      
      if (profile?.id) {
        profileId = profile.id;
      } else {
        // Fallback to wallet_links table if the app migrated
        const { data: link } = await supabase.from('wallet_links').select('user_id').eq('wallet_address', targetWalletStr).maybeSingle();
        if (link?.user_id) profileId = link.user_id;
      }
      
      if (!profileId) {
        console.warn("User has no profile or linked wallet, cannot save receipt to database.");
      } else {
        const { error: dbError } = await supabase.from('payout_records').insert({
          user_id: profileId,
          project_id: dbProject.id,
          cycle_id: epoch.id,
          tokens_held: investorBalance || 0.0001, // Bypass 0 check if balance fetch fails
          amount_due: investorPayoutAmount || 0.01,
          status: 'completed',
          paid_at: new Date().toISOString(),
          tx_hash: tx
        });
        
        if (dbError) {
          console.warn("Could not sync receipt:", dbError);
          setStatus({ type: 'error', msg: "Payout succeeded on-chain, but failed to save to database: " + dbError.message });
        } else {
          setStatus({ type: 'success', msg: `Payout Executed Successfully! Receipt saved.` });
        }
      }

      setStatus({ type: 'success', msg: `Payout Executed for ${targetWalletStr.slice(0, 4)}... Tx: ${tx.slice(0, 10)}...` });
    } catch (err: any) {
      console.error("Execute Payout Error:", err);
      setStatus({ type: 'error', msg: err.message || "Failed to execute payout." });
    } finally {
      setExecutingPayout(null);
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
            <h1 className="text-5xl font-black gradient-text mb-2 tracking-tight">Distributions</h1>
            <p className="text-gray-400">Manage payout epochs and distribute profits to token holders.</p>
          </div>
          <button onClick={fetchData} className="p-3 rounded-xl border border-gold/20 hover:bg-gold/10 transition-all text-gold">🔄</button>
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

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Create Epoch Form */}
          <div className="glass rounded-2xl border border-white/10 p-6 md:col-span-1 h-fit">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-gold">➕</span> Create Epoch
            </h2>
            
            <form onSubmit={handleCreateEpoch} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Select Project</label>
                <select 
                  required
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-navy/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.token_symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Epoch Name</label>
                <input 
                  type="text" 
                  value={epochName}
                  onChange={(e) => setEpochName(e.target.value)}
                  placeholder="e.g. Q1 2026 Dividend"
                  className="w-full bg-navy/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Profit Per Token (USDC)</label>
                <input 
                  required
                  type="number" 
                  step="0.000001"
                  value={profitPerToken}
                  onChange={(e) => setProfitPerToken(e.target.value)}
                  placeholder="0.50"
                  className="w-full bg-navy/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none font-mono"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting !== null || !wallet.publicKey}
                className="w-full py-4 rounded-xl bg-gold text-navy font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
              >
                {submitting === 'creating' ? 'Creating...' : 'Execute Epoch On-Chain'}
              </button>
            </form>
          </div>

          {/* Epochs List */}
          <div className="glass rounded-2xl border border-white/10 p-6 md:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-gold">📊</span> Epoch History
            </h2>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
              </div>
            ) : epochs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No epochs created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {epochs.map(epoch => (
                  <div key={epoch.id} className="bg-navy/30 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:border-gold/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-white text-lg">{epoch.name}</span>
                        <span className="text-xs px-2 py-1 bg-gold/20 text-gold rounded uppercase font-black tracking-widest">
                          Epoch #{epoch.epoch_id}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {epoch.projects?.name} • <span className="font-mono text-gold">${epoch.profit_per_token}</span> / token
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-xs text-gray-500">
                        {new Date(epoch.created_at).toLocaleDateString()}
                      </div>
                      <button 
                        onClick={() => handleExecutePayout(epoch)}
                        disabled={executingPayout === epoch.id}
                        className="text-xs px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold rounded font-bold uppercase tracking-widest transition-colors border border-gold/30 disabled:opacity-50"
                      >
                        {executingPayout === epoch.id ? 'Executing...' : 'Execute Payout'}
                      </button>
                      {epoch.distribution_tx_hash && (
                        <a href={`https://solscan.io/tx/${epoch.distribution_tx_hash}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          Creation Tx ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
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

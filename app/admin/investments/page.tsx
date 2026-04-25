"use client";

import { useEffect, useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN, Program, AnchorProvider } from '@coral-xyz/anchor';
import Link from 'next/link';
import { InvestmentRepository } from '@/lib/web3/repositories/investmentRepository';
import { ProjectRegistryService } from '@/lib/web3/services/projectRegistryService';
import { getRegistryPDA, getProjectPDA, getMintAuthorityPDA, getSubscriptionPDA, getComplianceControlPDA } from '@/lib/web3/utils/pdaHelpers';
import { getComplianceProgram } from '@/lib/web3/utils/programDiscoverer';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

export default function AdminInvestmentsPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [projects, setProjects] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

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

  const fetchData = async () => {
    if (!repo || !registryService) return;
    try {
      setLoading(true);
      const [allSubs, allProjects] = await Promise.all([
        repo.fetchAll(),
        registryService.fetchAllProjects()
      ]);

      // Map projects by ID for quick lookup
      const projectMap: Record<string, any> = {};
      allProjects.forEach((p: any) => {
        projectMap[p.account.projectId.toString()] = p.account;
      });

      setSubscriptions(allSubs);
      setProjects(projectMap);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setStatus({ type: 'error', msg: "Failed to load on-chain subscriptions." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [repo]);

  const handleFinalize = async (sub: any) => {
    if (!repo || !wallet.publicKey || !connection) return;
    
    const txHashInput = window.prompt("Enter Settlement Transaction Hash (64 bytes hex or string):");
    if (!txHashInput) return;

    // Default to the invested USDC amount formatted as human readable
    const defaultAmount = (Number(sub.account.investmentAmount.toString()) / 1_000_000).toString();
    const tokenAmountInput = window.prompt("Enter Token Amount to Issue (e.g. 1200.5):", defaultAmount);
    if (!tokenAmountInput) return;

    try {
      setSubmitting(sub.publicKey.toBase58());
      setStatus({ type: 'info', msg: "Preparing finalization transaction..." });

      const projectId = sub.account.projectId;
      const projectData = projects[projectId.toString()];
      if (!projectData) throw new Error("Project data not found in registry.");

      if (!projectData.mint || projectData.mint.toBase58() === PublicKey.default.toBase58()) {
        throw new Error("This project has no SPL Token Mint linked yet. Please create a mint first.");
      }

      // Get real decimals from the mint
      const mintInfo = await connection.getParsedAccountInfo(projectData.mint);
      const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 6;

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

      const tx = await repo['program'].methods
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
        .rpc();

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

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 glass animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="glass rounded-3xl p-20 text-center border border-white/5">
            <div className="text-6xl mb-6 opacity-20">💰</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Subscriptions Found</h3>
            <p className="text-gray-400">Wait for investors to commit funds to your projects.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {subscriptions.map((sub) => {
              const projectData = projects[sub.account.projectId.toString()];
              const isPending = sub.account.status.pending !== undefined;
              
              if (sub.account.projectId.toString() === "111") {
                console.log("Rendering Project 111:", {
                  name: projectData?.name,
                  mint: projectData?.mint?.toBase58(),
                  id: sub.account.projectId.toString()
                });
              }
              
              return (
                <div key={sub.publicKey.toBase58()} className={`glass rounded-2xl border transition-all overflow-hidden ${isPending ? 'border-gold/30' : 'border-white/5 opacity-60'}`}>
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-6 items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isPending ? 'bg-gold/20 text-gold' : 'bg-green-500/20 text-green-400'}`}>
                        {isPending ? "⏳" : "✅"}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                            {projectData?.name || `Project #${sub.account.projectId.toString()}`}
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isPending ? 'bg-gold/20 text-gold' : 'bg-green-500/20 text-green-400'}`}>
                            {isPending ? 'Pending Verification' : 'Allocated'}
                          </span>
                        </div>
                        <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                          <span>Investor: {sub.account.investor.toBase58().slice(0, 8)}...</span>
                          <span>ID: {sub.account.subscriptionId.toString()}</span>
                          <span className="text-amber-600/60 mt-1">Mint: {projectData?.mint?.toBase58().slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">
                          {(Number(sub.account.investmentAmount.toString()) / 1_000_000).toLocaleString()} USDC
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Investment Committed</div>
                      </div>

                      {isPending && (
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

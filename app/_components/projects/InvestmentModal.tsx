'use client';

import { useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { InvestmentService } from '@/lib/web3/services/investmentService';
import { COMPLIANCE_PROGRAM_ID } from '@/lib/web3/config/programs';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
    location: string;
    country: string;
    blockchain_project_id: number | null;
    onChain?: {
      minInvestmentUsdc: number;
      maxInvestmentUsdc: number;
      acceptedStablecoin: string;
    } | null;
  };
}

export function InvestmentModal({ isOpen, onClose, project }: InvestmentModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);

  const investmentService = useMemo(() => {
    if (!connection) return null;
    // We pass a mock wallet that uses the adapter's sendTransaction
    const mockWallet = {
      publicKey,
      sendTransaction: (tx: any, conn: any, opts: any) => sendTransaction(tx, conn, opts),
    };
    return new InvestmentService(connection, mockWallet);
  }, [connection, publicKey, sendTransaction]);

  if (!isOpen) return null;

  const investmentAmount = parseFloat(amount) || 0;
  const onChain = project.onChain;
  // USDC has 6 decimals, so if on-chain min is 1000000, it's 1 USDC.
  const minInvestment = onChain ? onChain.minInvestmentUsdc / 1_000_000 : 100;
  const maxInvestment = onChain ? onChain.maxInvestmentUsdc / 1_000_000 : 10000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!publicKey) {
      setError('Please connect your wallet first.');
      return;
    }

    if (project.blockchain_project_id === null) {
      setError('This project is not yet initialized on-chain.');
      return;
    }

    if (investmentAmount < minInvestment) {
      setError(`Minimum investment is $${minInvestment.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!investmentService) throw new Error("Investment service not initialized");

      console.log(`[InvestmentModal] Initiating on-chain subscription for project ${project.blockchain_project_id}...`);
      
      const signature = await investmentService.subscribe({
        projectId: project.blockchain_project_id,
        amount: investmentAmount,
        paymentAsset: new PublicKey(onChain?.acceptedStablecoin || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // Default USDC
      });

      console.log(`[InvestmentModal] Success! Tx: ${signature}`);
      setTxSig(signature);

      // Sync with backend
      await fetch('/api/investments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          amount: investmentAmount,
          blockchainSignature: signature,
          investorWallet: publicKey.toBase58(),
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // window.location.href = '/dashboard/investments';
      }, 5000);
    } catch (err: any) {
      console.error("[InvestmentModal] Error:", err);
      setError(err.message || 'Failed to process investment on-chain.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#0A1628] rounded-2xl border-2 border-gold/30 shadow-2xl shadow-gold/20 max-w-lg w-full p-8 overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {success ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Investment Recorded On-Chain!</h3>
              <p className="text-gray-400 mb-6">Your subscription intent has been immutably stored.</p>
              
              <div className="bg-navy/50 rounded-xl p-4 mb-8 border border-white/10">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Transaction Signature</p>
                <a 
                  href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                  target="_blank"
                  className="text-gold font-mono text-xs break-all hover:underline"
                >
                  {txSig}
                </a>
              </div>
              
              <button 
                onClick={onClose}
                className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 rounded-xl"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-3 py-1 mb-4">
                <span className="text-gold text-[10px] font-bold uppercase tracking-wider">On-Chain Subscription</span>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-1">Invest in {project.name}</h2>
              <p className="text-gray-400 text-sm mb-8">{project.location}, {project.country}</p>

              <div className="mb-8">
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Investment Amount (USDC)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-bold">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-navy/50 border-2 border-gold/20 rounded-xl py-4 px-10 text-white text-xl font-bold focus:border-gold focus:outline-none transition-all group-hover:border-gold/40"
                    placeholder="0"
                    min={minInvestment}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">USDC</div>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] text-gray-500">Min: ${minInvestment.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">Max: ${maxInvestment.toLocaleString()}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 animate-shake">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-200 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !publicKey || !amount}
                className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy font-bold py-4 rounded-xl transition-all duration-300 shadow-xl shadow-gold/20 hover:shadow-gold/40 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming on Solana...
                  </span>
                ) : !publicKey ? (
                  'Connect Wallet to Invest'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Confirm Investment
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

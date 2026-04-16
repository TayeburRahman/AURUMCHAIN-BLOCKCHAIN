'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ComplianceService } from '@/lib/web3/services/complianceService';
import { useWalletEligibility } from '@/hooks/useWalletEligibility';
import { syncKycApprovalAction, syncKycRevokeAction } from '@/app/admin/compliance/actions';

interface KycProfile {
// ... existing types
}

export function ComplianceReviewList({ initialPending }: { initialPending: any[] }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pendingItems, setPendingItems] = useState(initialPending);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default expiry: 1 year from now
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  const handleApprove = async (kyc: any, walletAddress: string) => {
    if (!wallet.connected) {
      setError("Please connect your admin wallet first.");
      return;
    }

    setLoadingId(kyc.id);
    setError(null);

    try {
      const service = new ComplianceService(connection, wallet);
      
      const identityHash = new Array(32).fill(0); 
      const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);

      // 1. Blockchain Transaction
      const result = await service.recordVerifiedWallet({
        wallet: walletAddress,
        kycStatus: 1, // Pass as number (mapped to Anchor object in Service)
        amlStatus: 0, 
        identityHash,
        investmentAllowed: true,
        transferAllowed: true,
        expiryTimestamp,
      });

      if (!result.success) {
        throw new Error(result.error || "On-chain transaction failed");
      }

      // 2. Server-side DB Synchronization
      const syncResult = await syncKycApprovalAction({
        wallet: walletAddress,
        kycStatus: 1, // Keep as number for Database sync
        amlStatus: 0, 
        identityHash,
        investmentAllowed: true,
        transferAllowed: true,
        expiryTimestamp,
        signature: result.data.signature
      });

      if (!syncResult.success) {
        console.warn("[ComplianceReviewList] On-chain success but DB sync failed:", syncResult.error);
        setError("On-chain verification succeeded, but database sync failed. Please refresh.");
      }

      setPendingItems(prev => prev.filter(p => p.id !== kyc.id));
      alert(`Success! Investor verified.\nTX: ${result.data.signature}`);

    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (kyc: any, walletAddress: string) => {
    if (!wallet.connected) return;

    setLoadingId(kyc.id);
    setError(null);

    try {
      const service = new ComplianceService(connection, wallet);
      
      // 1. Blockchain Transaction
      const result = await service.revokeWallet({ wallet: walletAddress });

      if (!result.success) {
        throw new Error(result.error || "On-chain revocation failed");
      }

      // 2. Server-side DB Synchronization
      const syncResult = await syncKycRevokeAction({
        wallet: walletAddress,
        signature: result.data.signature
      });

      if (syncResult.success) {
        setPendingItems(prev => prev.filter(p => p.id !== kyc.id));
      } else {
        setError("On-chain revocation succeeded, but DB sync failed.");
      }
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-200 hover:text-white">&times;</button>
        </div>
      )}

      {pendingItems.length === 0 ? (
        <div className="glass rounded-xl p-8 border border-gold/20 text-center">
          <p className="text-gray-400">No pending KYC reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingItems.map((kyc: any) => (
            <KycCard 
              key={kyc.id} 
              kyc={kyc} 
              onApprove={handleApprove} 
              onReject={handleReject}
              isLoading={loadingId === kyc.id}
              expiryDate={expiryDate}
              setExpiryDate={setExpiryDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KycCard({ kyc, onApprove, onReject, isLoading, expiryDate, setExpiryDate }: any) {
  const walletAddress = kyc.metadata?.wallet_address || ""; 
  const [shouldVerify, setShouldVerify] = useState(false);
  const { eligibility, loading: onChainLoading, error: rpcError } = useWalletEligibility(walletAddress, { enabled: shouldVerify });

  if (!walletAddress) {
    return (
      <div className="glass rounded-xl p-6 border border-red-500/20">
        <p className="text-red-400 text-sm">Error: No wallet address linked to this profile.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 border border-gold/20 transition-all hover:border-gold/40">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">
              {kyc.user?.first_name} {kyc.user?.last_name}
            </h3>
            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
              {kyc.status}
            </span>
            
            {shouldVerify ? (
              onChainLoading ? (
                <span className="animate-pulse bg-gold/10 text-gold/60 px-3 py-1 rounded-full text-xs font-medium">
                  CHECKING CHAIN...
                </span>
              ) : eligibility ? (
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                   ON-CHAIN VERIFIED
                </span>
              ) : rpcError ? (
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
                   RPC ERROR (RATE LIMIT)
                </span>
              ) : (
                <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-medium">
                  NOT FOUND ON-CHAIN
                </span>
              )
            ) : (
              <button 
                onClick={() => setShouldVerify(true)}
                className="bg-gold/10 hover:bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-medium transition-colors border border-gold/30"
              >
                🔍 VERIFY ON-CHAIN
              </button>
            )}
          </div>

          <p className="text-gray-400 text-sm mb-4">{kyc.user?.email}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm mb-6">
            <div className="space-y-1">
              <span className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Passport / ID</span>
              <p className="text-white font-mono text-xs truncate">
                {kyc.provider_applicant_id}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Nationality</span>
              <p className="text-white">{kyc.nationality || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Target Wallet</span>
              <p className="text-gold font-mono text-xs truncate">{walletAddress}</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col gap-3">
          <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
            <label className="text-[10px] text-gray-400 uppercase font-bold">Verification Expiry</label>
            <input 
              type="date" 
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="bg-navy border border-gold/30 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gold"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onApprove(kyc, walletAddress)}
              disabled={isLoading}
              className="flex-1 bg-green-500/80 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              {isLoading ? 'Processing...' : 'Approve On-Chain'}
            </button>
            <button 
              onClick={() => onReject(kyc, walletAddress)}
              disabled={isLoading}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

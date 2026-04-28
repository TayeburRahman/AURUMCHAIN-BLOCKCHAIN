'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ComplianceService } from '@/lib/web3/services/complianceService';

export function ApprovedInvestorsList({ investors }: { investors: any[] }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleBypass = async (walletAddress: string, currentState: boolean) => {
    if (!wallet.connected) {
      alert("Please connect your admin wallet first.");
      return;
    }
    setLoadingId(walletAddress);
    try {
      const service = new ComplianceService(connection, wallet);
      const result = await service.toggleLockupBypass(walletAddress, !currentState);
      if (!result.success) throw new Error(result.error || "Failed to toggle bypass");
      alert(`Success! Lockup bypass ${!currentState ? 'ENABLED' : 'DISABLED'} for ${walletAddress}`);
      // Refresh the page to get the updated on-chain state
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Bypass toggle failed");
    } finally {
      setLoadingId(null);
    }
  };

  if (!investors || investors.length === 0) {
    return (
      <div className="glass rounded-xl p-8 border border-gold/20 text-center">
        <p className="text-gray-400">No on-chain approvals found.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {investors.map((kyc: any) => {
        const walletAddress = kyc.metadata?.wallet_address;
        const isBypassEnabled = kyc.lockupBypass === true;
        
        return (
          <div key={kyc.id} className="glass rounded-xl p-4 border border-green-500/30 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <h3 className="text-white font-medium">
                  {kyc.user?.first_name} {kyc.user?.last_name}
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-1">
                Approved {new Date(kyc.approved_at).toLocaleDateString()}
              </p>
              {walletAddress && (
                <p className="text-gold font-mono text-xs">
                  {walletAddress}
                </p>
              )}
            </div>
            
            {walletAddress && (
              <button 
                onClick={() => handleToggleBypass(walletAddress, isBypassEnabled)}
                disabled={loadingId === walletAddress}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                  isBypassEnabled 
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
                }`}
                title={isBypassEnabled ? "Disable Emergency Exit" : "Enable Emergency Exit"}
              >
                {loadingId === walletAddress ? '...' : (isBypassEnabled ? '🔓 Unlocked' : '🔒 Locked')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

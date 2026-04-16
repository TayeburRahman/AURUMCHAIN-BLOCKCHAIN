import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ComplianceService } from '@/lib/web3/services/complianceService';

/**
 * useWalletEligibility hook
 * 
 * Fetches and monitors the on-chain eligibility status of the connected wallet
 * or a specific wallet address.
 */
export function useWalletEligibility(walletAddress?: string, options: { enabled?: boolean } = { enabled: true }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const targetWallet = walletAddress || publicKey?.toString();

  const fetchEligibility = useCallback(async () => {
    if (!targetWallet || !options.enabled) {
      setEligibility(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = new ComplianceService(connection, { publicKey: null });
      
      const program = (service as any).repository;
      const data = await program.fetchEligibilityAccount(new PublicKey(targetWallet));
      
      setEligibility(data);
    } catch (err: any) {
      if (err.message?.includes('Account does not exist') || err.message?.includes('not found')) {
        setEligibility(null); 
      } else {
        console.error("[useWalletEligibility] Error:", err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [connection, targetWallet, options.enabled]);

  useEffect(() => {
    if (options.enabled) {
      fetchEligibility();
    }
  }, [fetchEligibility, options.enabled]);

  return {
    eligibility,
    isVerified: eligibility?.kycStatus?.approved || eligibility?.kycStatus === 1,
    isExpired: eligibility?.expiryTimestamp 
      ? eligibility.expiryTimestamp.toNumber() < Date.now() / 1000 
      : false,
    loading,
    error,
    refresh: fetchEligibility
  };
}

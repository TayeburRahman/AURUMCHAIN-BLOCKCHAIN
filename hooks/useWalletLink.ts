import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletLinkService } from '@/lib/web3/wallet/walletLinkService';

/**
 * useWalletLink
 * 
 * Manages the state and logic for linking a Solana wallet to a user profile.
 * Handles loading states, errors, and verification checks.
 */
export function useWalletLink() {
  const wallet = useWallet();
  const [isLinking, setIsLinking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<any>(null);

  // Check current linking status on mount or when wallet connection changes
  const checkStatus = useCallback(async () => {
    if (wallet.connected && wallet.publicKey) {
      try {
        const data = await WalletLinkService.getLinkedWalletStatus();
        if (data && data.success && data.walletLink) {
          setActiveWallet(data.walletLink);
          // Check if the connected wallet matches the linked wallet address
          const isMatch = data.walletLink.wallet_address === wallet.publicKey.toBase58();
          setIsLinked(isMatch);
          setIsVerified(isMatch && data.walletLink.verified);
        } else {
          setIsLinked(false);
          setIsVerified(false);
          setActiveWallet(null);
        }
      } catch (err) {
        console.error("Failed to check wallet linking status:", err);
      } finally {
        setInitialLoading(false);
      }
    } else {
      setIsLinked(false);
      setIsVerified(false);
      setInitialLoading(false);
    }
  }, [wallet.connected, wallet.publicKey]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  /**
   * Triggers the "Handshake" (Signed Message verification)
   */
  const linkWallet = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      await WalletLinkService.linkWallet(wallet);
      setIsVerified(true);
      setIsLinked(true);
      // Refresh status to get the updated walletLink details
      await checkStatus();
    } catch (err: any) {
      setError(err.message || "Failed to verify wallet ownership");
      setIsVerified(false);
    } finally {
      setIsLinking(false);
    }
  }, [wallet, checkStatus]);

  return {
    isLinking,
    isLinked,
    isVerified,
    initialLoading,
    error,
    activeWallet,
    linkWallet,
    refreshStatus: checkStatus
  };
}

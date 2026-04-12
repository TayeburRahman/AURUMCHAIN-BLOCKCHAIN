/**
 * Hook: useWalletLink
 * Replaces useWalletStatus with proper wallet link management
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createClient } from '@/lib/supabase/client';

export interface WalletLinkStatus {
  // Connection state
  isWalletConnected: boolean;
  walletAddress: string | undefined;

  // Database state
  walletLinkId: string | null;
  isWalletLinked: boolean;
  isWalletVerified: boolean;

  // Actions
  linkWallet: () => Promise<void>;
  verifyWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;

  // Loading states
  isLinking: boolean;
  isVerifying: boolean;
  error: string | null;

  // User auth
  isAuthenticated: boolean;
  userId: string | null;
}

export function useWalletLink(): WalletLinkStatus {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletLinkId, setWalletLinkId] = useState<string | null>(null);
  const [isWalletLinked, setIsWalletLinked] = useState(false);
  const [isWalletVerified, setIsWalletVerified] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check status on mount and when address changes
  useEffect(() => {
    checkStatus();
  }, [address, isConnected]);

  async function checkStatus() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);

        // Check for active wallet link
        const { data: walletLink } = await supabase
          .from('wallet_links')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (walletLink) {
          setWalletLinkId(walletLink.id);
          setIsWalletLinked(true);
          setIsWalletVerified(walletLink.verified);
        } else {
          setWalletLinkId(null);
          setIsWalletLinked(false);
          setIsWalletVerified(false);
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setWalletLinkId(null);
        setIsWalletLinked(false);
        setIsWalletVerified(false);
      }
    } catch (err) {
      console.error('Error checking wallet link status:', err);
    }
  }

  async function linkWallet() {
    if (!isConnected || !address || !userId) {
      setError('Please connect your wallet and sign in first');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      // Call API to link wallet
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          chainId: 1, // TODO: Get from wagmi config
          walletType: 'metamask', // TODO: Detect wallet type
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to link wallet');
      }

      setWalletLinkId(result.walletLink.id);
      setIsWalletLinked(true);

      await checkStatus();
    } catch (err: any) {
      console.error('Error linking wallet:', err);
      setError(err.message || 'Failed to link wallet');
    } finally {
      setIsLinking(false);
    }
  }

  async function verifyWallet() {
    if (!walletLinkId || !address) {
      setError('Please link your wallet first');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Generate nonce
      const nonce = Math.random().toString(36).substring(7);

      // Message to sign
      const message = `Connect wallet to GoldenFleece\n\nWallet: ${address}\nNonce: ${nonce}\n\nThis signature proves you own this wallet.`;

      // Request signature from user
      const signature = await signMessageAsync({ message });

      // Call API to verify
      const response = await fetch('/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletLinkId,
          signature,
          message,
          nonce,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify wallet');
      }

      setIsWalletVerified(true);

      await checkStatus();
    } catch (err: any) {
      console.error('Error verifying wallet:', err);
      setError(err.message || 'Failed to verify wallet');
    } finally {
      setIsVerifying(false);
    }
  }

  async function disconnectWallet() {
    if (!userId) return;

    setIsLinking(true);
    setError(null);

    try {
      const supabase = createClient();

      // Deactivate wallet link
      await supabase
        .from('wallet_links')
        .update({
          is_active: false,
          disconnected_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      await checkStatus();
    } catch (err: any) {
      console.error('Error disconnecting wallet:', err);
      setError(err.message || 'Failed to disconnect wallet');
    } finally {
      setIsLinking(false);
    }
  }

  return {
    isWalletConnected: isConnected,
    walletAddress: address,
    walletLinkId,
    isWalletLinked,
    isWalletVerified,
    linkWallet,
    verifyWallet,
    disconnectWallet,
    isLinking,
    isVerifying,
    error,
    isAuthenticated,
    userId,
  };
}

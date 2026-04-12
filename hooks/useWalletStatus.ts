import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createClient } from '@/lib/supabase/client';

export type InvestorTier = 'browser' | 'investor' | 'vip';

export interface WalletStatus {
  // Wallet connection status
  isWalletConnected: boolean;
  walletAddress: string | undefined;

  // Supabase auth status
  isAuthenticated: boolean;
  userId: string | null;

  // Combined status
  isWalletLinked: boolean; // Wallet connected AND saved to Supabase
  investorTier: InvestorTier;

  // Actions
  linkWallet: () => Promise<void>;
  unlinkWallet: () => Promise<void>;
  refreshStatus: () => Promise<void>;

  // Loading states
  isLinking: boolean;
  error: string | null;
}

export function useWalletStatus(): WalletStatus {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isWalletLinked, setIsWalletLinked] = useState(false);
  const [investorTier, setInvestorTier] = useState<InvestorTier>('browser');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check Supabase auth and wallet status - memoized with useCallback
  const checkStatus = useCallback(async () => {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_') || supabaseKey.length < 100) {
      // Supabase not configured - set default values
      setIsAuthenticated(false);
      setUserId(null);
      setIsWalletLinked(false);
      setInvestorTier('browser');
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);

        // Check if wallet is linked
        const { data: profile } = await supabase
          .from('profiles')
          .select('crypto_wallet_address, investor_tier')
          .eq('id', user.id)
          .single();

        if (profile) {
          const walletLinked = !!profile.crypto_wallet_address;
          setIsWalletLinked(walletLinked);
          setInvestorTier((profile.investor_tier as InvestorTier) || 'browser');
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setIsWalletLinked(false);
        setInvestorTier('browser');
      }
    } catch (err) {
      // Silently handle errors - don't spam console
      setIsAuthenticated(false);
      setUserId(null);
      setIsWalletLinked(false);
      setInvestorTier('browser');
    }
  }, []); // Empty dependency array since this function doesn't depend on any external values

  // Link wallet to user profile
  const linkWallet = async () => {
    if (!isConnected || !address || !userId) {
      setError('Please connect your wallet and sign in first');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const supabase = createClient();

      // Generate nonce for signature
      const nonce = Math.random().toString(36).substring(7);

      // Message to sign
      const message = `Connect wallet to GoldenFleece\n\nWallet: ${address}\nNonce: ${nonce}\n\nThis signature proves you own this wallet.`;

      // Request signature from user
      const signature = await signMessageAsync({ message });

      // Save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          crypto_wallet_address: address.toLowerCase(),
          crypto_wallet_type: 'metamask', // Could detect wallet type
          crypto_wallet_connected_at: new Date().toISOString(),
          wallet_verification_nonce: nonce,
          investor_tier: 'investor', // Upgrade to investor tier
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Refresh status
      await checkStatus();

      setError(null);
    } catch (err: any) {
      console.error('Error linking wallet:', err);
      setError(err.message || 'Failed to link wallet');
    } finally {
      setIsLinking(false);
    }
  };

  // Unlink wallet from profile
  const unlinkWallet = async () => {
    if (!userId) return;

    setIsLinking(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          crypto_wallet_address: null,
          crypto_wallet_type: null,
          crypto_wallet_connected_at: null,
          wallet_verification_nonce: null,
          investor_tier: 'browser', // Downgrade to browser tier
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      await checkStatus();
      setError(null);
    } catch (err: any) {
      console.error('Error unlinking wallet:', err);
      setError(err.message || 'Failed to unlink wallet');
    } finally {
      setIsLinking(false);
    }
  };

  // Check status on mount and when address/auth changes
  useEffect(() => {
    checkStatus();
  }, [address, isConnected, checkStatus]);

  return {
    isWalletConnected: isConnected,
    walletAddress: address,
    isAuthenticated,
    userId,
    isWalletLinked,
    investorTier,
    linkWallet,
    unlinkWallet,
    refreshStatus: checkStatus,
    isLinking,
    error,
  };
}

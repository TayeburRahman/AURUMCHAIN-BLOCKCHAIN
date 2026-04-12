"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletStatus } from '@/hooks/useWalletStatus';

export function WalletConnection() {
  const {
    isWalletConnected,
    walletAddress,
    isWalletLinked,
    investorTier,
    linkWallet,
    unlinkWallet,
    isLinking,
    error,
  } = useWalletStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Crypto Wallet</h2>
        <p className="text-gray-400 text-sm">
          Connect your Web3 wallet to unlock investment features and receive blockchain dividends.
        </p>
      </div>

      {/* Investor Tier Badge */}
      <div className="glass rounded-lg p-4 border border-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Investor Tier</p>
            <p className="text-lg font-bold text-gold capitalize mt-1">{investorTier}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${
            investorTier === 'investor' ? 'bg-gold/20 text-gold' :
            investorTier === 'vip' ? 'bg-purple-500/20 text-purple-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {investorTier === 'browser' && '🔒 Browse Only'}
            {investorTier === 'investor' && '✓ Can Invest'}
            {investorTier === 'vip' && '⭐ VIP Access'}
          </div>
        </div>
      </div>

      {/* Wallet Status */}
      <div className="glass rounded-lg p-6 border border-gold/20 space-y-4">
        {/* RainbowKit Connect Button */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            1. Connect Wallet
          </label>
          <ConnectButton
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
            chainStatus="icon"
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
        </div>

        {/* Link/Unlink Wallet */}
        {isWalletConnected && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              2. {isWalletLinked ? 'Wallet Linked' : 'Link to Account'}
            </label>

            {isWalletLinked ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-400">Wallet Connected</p>
                      <p className="text-xs text-green-300 mt-1 font-mono">{walletAddress}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        You can now make investments and receive blockchain dividends.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={unlinkWallet}
                  disabled={isLinking}
                  className="w-full px-4 py-2 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg transition-all duration-300 text-sm disabled:opacity-50"
                >
                  {isLinking ? 'Unlinking...' : 'Unlink Wallet'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-400">Link Required</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Link your wallet to upgrade to Investor tier and unlock investment features.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={linkWallet}
                  disabled={isLinking}
                  className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLinking ? 'Linking...' : 'Link Wallet to Account'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-lg p-4 border border-gold/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Secure & Private</h3>
              <p className="text-xs text-gray-400 mt-1">
                Your wallet remains in your control. We never access your private keys.
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-4 border border-gold/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Low Fees</h3>
              <p className="text-xs text-gray-400 mt-1">
                Built on Polygon for minimal transaction costs and fast confirmations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

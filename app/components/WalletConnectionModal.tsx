"use client";

import { Fragment } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletStatus } from '@/hooks/useWalletStatus';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function WalletConnectionModal({ isOpen, onClose, feature = "this feature" }: WalletConnectionModalProps) {
  const { isWalletConnected, isWalletLinked, linkWallet, isLinking, error } = useWalletStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-navy-dark rounded-2xl border-2 border-gold/30 shadow-2xl shadow-gold/20 max-w-lg w-full p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-center mb-6">
            To use {feature}, you need to connect and verify your crypto wallet
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            {/* Step 1: Connect */}
            <div className={`p-4 rounded-lg border ${isWalletConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-navy border-gold/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isWalletConnected ? 'bg-green-500 text-white' : 'bg-gold/20 text-gold'
                  }`}>
                    {isWalletConnected ? '✓' : '1'}
                  </div>
                  <span className="text-white font-medium">Connect Wallet</span>
                </div>
                {isWalletConnected && (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {!isWalletConnected && (
                <div className="mt-3 flex justify-center">
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button
                        onClick={openConnectModal}
                        className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </ConnectButton.Custom>
                </div>
              )}
            </div>

            {/* Step 2: Verify */}
            <div className={`p-4 rounded-lg border ${
              isWalletLinked ? 'bg-green-500/10 border-green-500/20' :
              isWalletConnected ? 'bg-navy border-gold/20' : 'bg-navy-dark/50 border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isWalletLinked ? 'bg-green-500 text-white' :
                    isWalletConnected ? 'bg-gold/20 text-gold' : 'bg-gray-600 text-gray-400'
                  }`}>
                    {isWalletLinked ? '✓' : '2'}
                  </div>
                  <span className={`font-medium ${isWalletConnected ? 'text-white' : 'text-gray-400'}`}>
                    Verify Ownership
                  </span>
                </div>
                {isWalletLinked && (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {isWalletConnected && !isWalletLinked && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-3">
                    Sign a message to prove you own this wallet (free, no gas fees)
                  </p>
                  <button
                    onClick={linkWallet}
                    disabled={isLinking}
                    className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    {isLinking ? 'Signing...' : 'Sign Message'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {isWalletLinked && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Success!</span>
                </div>
                <p className="text-sm text-gray-300">
                  Your wallet is connected and verified. You can now use {feature}!
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Continue
              </button>
            </div>
          )}

          {/* Info */}
          {!isWalletLinked && (
            <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your wallet remains in your control. We never access your private keys.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

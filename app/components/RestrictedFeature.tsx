"use client";

import { useState } from 'react';
import { useWalletStatus } from '@/hooks/useWalletStatus';
import { WalletConnectionModal } from './WalletConnectionModal';
import Link from 'next/link';

interface RestrictedFeatureProps {
  children: React.ReactNode;
  requiredTier?: 'investor' | 'vip';
  feature?: string;
  className?: string;
}

export function RestrictedFeature({
  children,
  requiredTier = 'investor',
  feature = 'this feature',
  className = ''
}: RestrictedFeatureProps) {
  const { investorTier, isAuthenticated } = useWalletStatus();
  const [showModal, setShowModal] = useState(false);

  const tierLevels = { browser: 0, investor: 1, vip: 2 };
  const hasAccess = tierLevels[investorTier] >= tierLevels[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Blurred/disabled content */}
        <div className="pointer-events-none opacity-40 blur-sm">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/80 backdrop-blur-sm rounded-lg border-2 border-gold/30">
          <div className="text-center px-6 py-8 max-w-md">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {requiredTier === 'vip' ? 'VIP Feature' : 'Investor Access Required'}
            </h3>

            <p className="text-gray-300 text-sm mb-6">
              {isAuthenticated
                ? `Connect your crypto wallet to unlock ${feature} and start investing.`
                : `Sign in and connect your crypto wallet to access ${feature}.`}
            </p>

            {isAuthenticated ? (
              <button
                onClick={() => setShowModal(true)}
                className="inline-block bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-gold/20"
              >
                Connect Wallet
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-block bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-gold/20"
              >
                Sign In
              </Link>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Current tier: <span className="text-gold capitalize">{investorTier}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
      />
    </>
  );
}

// Simpler version for inline buttons
export function RestrictedButton({
  onClick,
  children,
  disabled = false,
  className = '',
  requiredTier = 'investor' as 'investor' | 'vip',
  feature = 'this action',
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  requiredTier?: 'investor' | 'vip';
  feature?: string;
}) {
  const { investorTier } = useWalletStatus();
  const [showModal, setShowModal] = useState(false);

  const tierLevels = { browser: 0, investor: 1, vip: 2 };
  const hasAccess = tierLevels[investorTier] >= tierLevels[requiredTier];

  if (!hasAccess) {
    return (
      <>
        <div className="relative inline-block">
          <button
            onClick={() => setShowModal(true)}
            className={`relative ${className}`}
          >
            {children}
            <div className="absolute -top-2 -right-2">
              <div className="bg-gold text-navy text-xs font-bold px-2 py-1 rounded-full">
                🔒
              </div>
            </div>
          </button>
        </div>

        {/* Wallet Connection Modal */}
        <WalletConnectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
        />
      </>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

/**
 * Component: EligibilityBanner
 * Shows user's eligibility status and required next steps
 */

'use client';

import { useEligibility } from '@/lib/domains/shared/hooks/useEligibility';
import { useWalletLink } from '@/lib/domains/shared/hooks/useWalletLink';
import Link from 'next/link';

export function EligibilityBanner() {
  const { status, canInvest, requiredSteps, isLoading } = useEligibility();
  const { linkWallet, verifyWallet, isWalletConnected, isWalletVerified, isLinking, isVerifying } = useWalletLink();

  // Don't show if user can already invest
  if (canInvest || isLoading) return null;

  // Don't show if suspended or restricted (show different UI)
  if (status === 'suspended' || status === 'restricted') return null;

  const statusLabels: Record<string, { title: string; description: string; color: string }> = {
    registered: {
      title: 'Welcome to GoldenFleece!',
      description: 'Complete a few steps to start investing in gold mines',
      color: 'blue',
    },
    wallet_connected: {
      title: 'Verify Your Wallet',
      description: 'Sign a message to prove you own this wallet',
      color: 'yellow',
    },
    wallet_verified: {
      title: 'Complete KYC Verification',
      description: 'Verify your identity to unlock investment features',
      color: 'purple',
    },
    kyc_pending: {
      title: 'KYC Submitted',
      description: 'Your documents are being reviewed. This usually takes 24-48 hours.',
      color: 'blue',
    },
    kyc_under_review: {
      title: 'KYC Under Review',
      description: 'Our compliance team is reviewing your submission',
      color: 'blue',
    },
    kyc_approved: {
      title: 'Almost There!',
      description: 'Verify your wallet to start investing',
      color: 'green',
    },
    kyc_rejected: {
      title: 'KYC Verification Failed',
      description: 'Please review the issues and resubmit',
      color: 'red',
    },
    investment_eligible: {
      title: 'Ready to Invest!',
      description: 'You can now invest in mining projects',
      color: 'green',
    },
  };

  const config = statusLabels[status] || statusLabels.registered;
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={`rounded-xl border-2 p-6 mb-6 ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          {status === 'kyc_rejected' ? (
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : canInvest ? (
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{config.title}</h3>
          <p className="text-gray-300 text-sm mb-4">{config.description}</p>

          {/* Required steps */}
          {requiredSteps.length > 0 && (
            <div className="space-y-2 mb-4">
              {requiredSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {status === 'registered' && !isWalletConnected && (
              <button
                onClick={linkWallet}
                disabled={isLinking}
                className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isLinking ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            {(status === 'wallet_connected' || (status === 'registered' && isWalletConnected)) && !isWalletVerified && (
              <button
                onClick={verifyWallet}
                disabled={isVerifying}
                className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify Wallet'}
              </button>
            )}

            {status === 'wallet_verified' && (
              <Link
                href="/dashboard/settings?tab=kyc"
                className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Start KYC Verification
              </Link>
            )}

            {status === 'kyc_approved' && !isWalletVerified && (
              <button
                onClick={verifyWallet}
                disabled={isVerifying}
                className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify Wallet'}
              </button>
            )}

            {status === 'kyc_rejected' && (
              <Link
                href="/dashboard/settings?tab=kyc"
                className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Resubmit KYC
              </Link>
            )}
          </div>
        </div>

        {/* Dismiss button (optional) */}
        {status !== 'kyc_pending' && status !== 'kyc_under_review' && (
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Component: KycStatusCard
 * Shows KYC verification status with actions
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { KycProfile } from '@/lib/domains/compliance/models';

export function KycStatusCard() {
  const [kycProfile, setKycProfile] = useState<KycProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKycProfile();
  }, []);

  async function loadKycProfile() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('kyc_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setKycProfile(data as KycProfile | null);
    } catch (error) {
      console.error('Failed to load KYC profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 border border-gold/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    not_started: {
      title: 'KYC Not Started',
      description: 'Complete identity verification to unlock investment features',
      color: 'gray',
      icon: '📋',
    },
    pending: {
      title: 'KYC Pending Review',
      description: 'Your documents have been submitted and are waiting for review',
      color: 'blue',
      icon: '⏳',
    },
    under_review: {
      title: 'KYC Under Review',
      description: 'Our compliance team is reviewing your submission',
      color: 'yellow',
      icon: '🔍',
    },
    approved: {
      title: 'KYC Approved',
      description: 'Your identity has been verified successfully',
      color: 'green',
      icon: '✅',
    },
    rejected: {
      title: 'KYC Rejected',
      description: kycProfile?.rejectionReason || 'Please review the issues and resubmit',
      color: 'red',
      icon: '❌',
    },
    expired: {
      title: 'KYC Expired',
      description: 'Your verification has expired. Please resubmit documents',
      color: 'orange',
      icon: '⚠️',
    },
  };

  const status = kycProfile?.status || 'not_started';
  const config = statusConfig[status as keyof typeof statusConfig];

  const colorClasses = {
    gray: 'border-gray-500/30',
    blue: 'border-blue-500/30 bg-blue-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
  };

  return (
    <div className={`glass rounded-xl p-6 border-2 ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{config.icon}</div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{config.title}</h3>
          <p className="text-gray-300 text-sm mb-4">{config.description}</p>

          {/* Metadata */}
          {kycProfile && (
            <div className="space-y-2 text-sm">
              {kycProfile.submittedAt && (
                <div className="flex gap-2">
                  <span className="text-gray-400">Submitted:</span>
                  <span className="text-white">{new Date(kycProfile.submittedAt).toLocaleDateString()}</span>
                </div>
              )}

              {kycProfile.approvedAt && (
                <div className="flex gap-2">
                  <span className="text-gray-400">Approved:</span>
                  <span className="text-green-400">{new Date(kycProfile.approvedAt).toLocaleDateString()}</span>
                </div>
              )}

              {kycProfile.rejectedAt && (
                <div className="flex gap-2">
                  <span className="text-gray-400">Rejected:</span>
                  <span className="text-red-400">{new Date(kycProfile.rejectedAt).toLocaleDateString()}</span>
                </div>
              )}

              {kycProfile.providerApplicantId && (
                <div className="flex gap-2">
                  <span className="text-gray-400">Application ID:</span>
                  <span className="text-white font-mono text-xs">{kycProfile.providerApplicantId}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4">
            {(status === 'not_started' || status === 'rejected' || status === 'expired') && (
              <button
                onClick={() => {
                  // TODO: Open Sumsub verification flow
                  alert('Sumsub KYC verification will be integrated here');
                }}
                className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                {status === 'not_started' ? 'Start Verification' : 'Resubmit Documents'}
              </button>
            )}

            {status === 'pending' || status === 'under_review' ? (
              <div className="text-sm text-gray-400">
                ⏱️ Average processing time: 24-48 hours
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook: useEligibility
 * Replaces investor_tier-based access control with proper eligibility checking
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EligibilityState } from '@/lib/domains/compliance/models';
import type { EligibilityStatus } from '@/lib/domains/shared/types';

export interface EligibilityCheck {
  isEligible: boolean;
  status: EligibilityStatus;
  canInvest: boolean;
  canWithdraw: boolean;
  canReceiveDividends: boolean;
  restrictionReason?: string;
  requiredSteps: string[];
  isLoading: boolean;
}

export function useEligibility(): EligibilityCheck {
  const [eligibility, setEligibility] = useState<EligibilityState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEligibility();
  }, []);

  async function loadEligibility() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('eligibility_states')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setEligibility(data as EligibilityState | null);
    } catch (error) {
      console.error('Failed to load eligibility:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const requiredSteps = getRequiredSteps(eligibility?.status || 'registered');

  return {
    isEligible: eligibility?.canInvest === true,
    status: eligibility?.status || 'registered',
    canInvest: eligibility?.canInvest === true,
    canWithdraw: eligibility?.canWithdraw === true,
    canReceiveDividends: eligibility?.canReceiveDividends === true,
    restrictionReason: eligibility?.restrictionReason,
    requiredSteps,
    isLoading,
  };
}

function getRequiredSteps(status: EligibilityStatus): string[] {
  const steps: string[] = [];

  if (status === 'registered') {
    steps.push('Connect your crypto wallet');
    steps.push('Verify wallet ownership');
    steps.push('Complete KYC verification');
  } else if (status === 'wallet_connected') {
    steps.push('Verify wallet ownership');
    steps.push('Complete KYC verification');
  } else if (status === 'wallet_verified') {
    steps.push('Complete KYC verification');
  } else if (status === 'kyc_pending' || status === 'kyc_under_review') {
    steps.push('Wait for KYC approval');
  } else if (status === 'kyc_rejected') {
    steps.push('Resubmit KYC verification');
  } else if (status === 'kyc_approved') {
    steps.push('Verify your wallet to start investing');
  }

  return steps;
}

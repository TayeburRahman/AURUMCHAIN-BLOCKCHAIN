/**
 * Compliance/KYC service - handles KYC verification and eligibility
 */

import { createClient } from '@/lib/supabase/server';
import type { KycProfile, EligibilityState, SumsubWebhookPayload } from './models';
import type { EligibilityStatus } from '../shared/types';
import { createAuditLog } from '../admin/service';

export class ComplianceService {
  /**
   * Get or create KYC profile for user
   */
  static async getOrCreateKycProfile(userId: string): Promise<KycProfile> {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('kyc_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) return existing as KycProfile;

    // Create new KYC profile
    const { data, error } = await supabase
      .from('kyc_profiles')
      .insert({
        user_id: userId,
        status: 'not_started',
        provider: 'sumsub',
      })
      .select()
      .single();

    if (error) throw error;

    return data as KycProfile;
  }

  /**
   * Create Sumsub applicant (placeholder - integrate with Sumsub SDK)
   */
  static async createSumsubApplicant(userId: string, userData: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<string> {
    // TODO: Integrate with Sumsub SDK
    // const applicant = await sumsubClient.createApplicant({
    //   externalUserId: userId,
    //   email: userData.email,
    //   firstName: userData.firstName,
    //   lastName: userData.lastName,
    // });

    const supabase = await createClient();

    // For now, generate a placeholder applicant ID
    const applicantId = `SUMSUB_${userId.slice(0, 8)}`;

    // Update KYC profile
    await supabase
      .from('kyc_profiles')
      .update({
        provider_applicant_id: applicantId,
        first_name: userData.firstName,
        last_name: userData.lastName,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Update eligibility
    await this.updateEligibility(userId, 'kyc_pending');

    // Audit log
    await createAuditLog({
      eventType: 'kyc_submitted',
      userId,
      actorRole: 'user',
      description: 'KYC verification submitted to Sumsub',
      metadata: { applicantId },
    });

    return applicantId;
  }

  /**
   * Handle Sumsub webhook (application reviewed)
   */
  static async handleSumsubWebhook(payload: SumsubWebhookPayload): Promise<void> {
    const supabase = await createClient();

    // Find KYC profile by applicant ID
    const { data: kycProfile } = await supabase
      .from('kyc_profiles')
      .select('*')
      .eq('provider_applicant_id', payload.applicantId)
      .single();

    if (!kycProfile) {
      console.error('KYC profile not found for applicant:', payload.applicantId);
      return;
    }

    const userId = kycProfile.user_id;

    // Handle review result
    if (payload.reviewResult?.reviewAnswer === 'GREEN') {
      // Approved
      await supabase
        .from('kyc_profiles')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await this.updateEligibility(userId, 'kyc_approved');

      // Audit log
      await createAuditLog({
        eventType: 'kyc_approved',
        userId,
        actorRole: 'compliance_officer',
        description: 'KYC verification approved',
        metadata: payload,
      });
    } else if (payload.reviewResult?.reviewAnswer === 'RED') {
      // Rejected
      await supabase
        .from('kyc_profiles')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          rejection_reason: payload.reviewResult.reviewRejectType,
          rejection_code: payload.reviewResult.rejectLabels?.join(', '),
        })
        .eq('user_id', userId);

      await this.updateEligibility(userId, 'kyc_rejected');

      // Audit log
      await createAuditLog({
        eventType: 'kyc_rejected',
        userId,
        actorRole: 'compliance_officer',
        description: 'KYC verification rejected',
        metadata: payload,
      });
    }
  }

  /**
   * Get eligibility state for user
   */
  static async getEligibility(userId: string): Promise<EligibilityState | null> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('eligibility_states')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data as EligibilityState | null;
  }

  /**
   * Update eligibility status
   */
  static async updateEligibility(
    userId: string,
    newStatus: EligibilityStatus,
    reason?: string
  ): Promise<void> {
    const supabase = await createClient();

    // Get current eligibility
    const { data: current } = await supabase
      .from('eligibility_states')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate permission flags based on status
    const permissions = this.calculatePermissions(newStatus);

    // Update eligibility
    await supabase
      .from('eligibility_states')
      .update({
        status: newStatus,
        previous_status: current?.status,
        status_changed_at: new Date().toISOString(),
        ...permissions,
        ...(reason && { restriction_reason: reason }),
      })
      .eq('user_id', userId);

    // Audit log
    await createAuditLog({
      eventType: 'eligibility_changed',
      userId,
      actorRole: undefined,
      description: `Eligibility changed from ${current?.status} to ${newStatus}`,
      previousState: current ? { status: current.status, ...current } : undefined,
      newState: { status: newStatus, ...permissions },
      metadata: reason ? { reason } : undefined,
    });
  }

  /**
   * Calculate permission flags from eligibility status
   */
  private static calculatePermissions(status: EligibilityStatus): {
    can_invest: boolean;
    can_withdraw: boolean;
    can_receive_dividends: boolean;
  } {
    const canInvest = status === 'investment_eligible';
    const canWithdraw = ['kyc_approved', 'investment_eligible'].includes(status);
    const canReceiveDividends = ['kyc_approved', 'investment_eligible'].includes(status);

    return {
      can_invest: canInvest,
      can_withdraw: canWithdraw,
      can_receive_dividends: canReceiveDividends,
    };
  }

  /**
   * Check if user is eligible to invest
   */
  static async isEligibleToInvest(userId: string): Promise<boolean> {
    const eligibility = await this.getEligibility(userId);
    return eligibility?.canInvest === true;
  }
}

/**
 * Helper function to update eligibility when wallet state changes
 */
export async function updateEligibilityOnWalletChange(
  userId: string,
  walletStatus: 'wallet_connected' | 'wallet_verified' | 'registered'
): Promise<void> {
  const supabase = await createClient();

  // Get KYC status
  const { data: kycProfile } = await supabase
    .from('kyc_profiles')
    .select('status')
    .eq('user_id', userId)
    .single();

  const kycStatus = kycProfile?.status || 'not_started';

  // Determine new eligibility status based on wallet + KYC state
  let newStatus: EligibilityStatus = 'registered';

  if (walletStatus === 'wallet_verified' && kycStatus === 'approved') {
    newStatus = 'investment_eligible';
  } else if (kycStatus === 'approved') {
    newStatus = 'kyc_approved';
  } else if (kycStatus === 'rejected') {
    newStatus = 'kyc_rejected';
  } else if (kycStatus === 'under_review') {
    newStatus = 'kyc_under_review';
  } else if (kycStatus === 'pending') {
    newStatus = 'kyc_pending';
  } else if (walletStatus === 'wallet_verified') {
    newStatus = 'wallet_verified';
  } else if (walletStatus === 'wallet_connected') {
    newStatus = 'wallet_connected';
  }

  await ComplianceService.updateEligibility(userId, newStatus);
}

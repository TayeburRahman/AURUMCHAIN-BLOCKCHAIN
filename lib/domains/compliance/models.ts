/**
 * Compliance/KYC domain models
 */

import { z } from 'zod';
import { uuidSchema } from '../shared/schemas';
import type { KycStatus, KycProvider, EligibilityStatus } from '../shared/types';

// KYC Profile model
export const kycProfileSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,

  // Provider information
  provider: z.enum(['sumsub', 'manual', 'other'] as const) as z.ZodType<KycProvider>,
  providerApplicantId: z.string().optional(), // Sumsub applicant ID

  // Status
  status: z.enum([
    'not_started',
    'pending',
    'under_review',
    'approved',
    'rejected',
    'expired',
  ] as const) as z.ZodType<KycStatus>,

  // Personal information (stored securely)
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.date().optional(),
  nationality: z.string().optional(),

  // Document information
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  documentCountry: z.string().optional(),

  // Review information
  submittedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  approvedAt: z.date().optional(),
  rejectedAt: z.date().optional(),
  expiresAt: z.date().optional(),

  // Reviewer notes (for manual review)
  reviewerNotes: z.string().optional(),
  reviewerId: uuidSchema.optional(),

  // Rejection reason
  rejectionReason: z.string().optional(),
  rejectionCode: z.string().optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KycProfile = z.infer<typeof kycProfileSchema>;

// Eligibility state model
export const eligibilityStateSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,

  status: z.enum([
    'registered',
    'wallet_connected',
    'wallet_verified',
    'kyc_pending',
    'kyc_under_review',
    'kyc_approved',
    'kyc_rejected',
    'investment_eligible',
    'restricted',
    'suspended',
  ] as const) as z.ZodType<EligibilityStatus>,

  // Eligibility flags
  canInvest: z.boolean().default(false),
  canWithdraw: z.boolean().default(false),
  canReceiveDividends: z.boolean().default(false),

  // Restriction information
  restrictionReason: z.string().optional(),
  restrictedAt: z.date().optional(),
  restrictedUntil: z.date().optional(),

  // State transition tracking
  previousStatus: z.string().optional(),
  statusChangedAt: z.date(),
  statusChangedBy: uuidSchema.optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EligibilityState = z.infer<typeof eligibilityStateSchema>;

// Sumsub webhook payload (simplified)
export const sumsubWebhookPayloadSchema = z.object({
  applicantId: z.string(),
  inspectionId: z.string().optional(),
  correlationId: z.string().optional(),
  externalUserId: z.string().optional(),
  type: z.string(),
  reviewStatus: z.string().optional(),
  reviewResult: z.object({
    reviewAnswer: z.enum(['GREEN', 'RED', 'YELLOW']).optional(),
    rejectLabels: z.array(z.string()).optional(),
    reviewRejectType: z.string().optional(),
  }).optional(),
  createdAt: z.string().optional(),
});

export type SumsubWebhookPayload = z.infer<typeof sumsubWebhookPayloadSchema>;

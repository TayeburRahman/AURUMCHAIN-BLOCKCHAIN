/**
 * Zod schemas for validation across domains
 */

import { z } from 'zod';

// Ethereum address schema
export const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// UUID schema
export const uuidSchema = z.string().uuid();

// Money/decimal schemas
export const moneySchema = z.number().nonnegative();
export const tokenAmountSchema = z.number().nonnegative();

// Date schemas
export const futureDateSchema = z.date().refine((date) => date > new Date(), {
  message: 'Date must be in the future',
});

// Eligibility check result
export const eligibilityCheckSchema = z.object({
  isEligible: z.boolean(),
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
  ]),
  reason: z.string().optional(),
  requiredSteps: z.array(z.string()).optional(),
});

// Investor tier schema
export const investorTierSchema = z.enum(['browser', 'investor', 'vip']);

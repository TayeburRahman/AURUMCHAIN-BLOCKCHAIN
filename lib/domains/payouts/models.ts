/**
 * Payouts domain models
 */

import { z } from 'zod';
import { uuidSchema, moneySchema, tokenAmountSchema } from '../shared/schemas';
import type { PayoutStatus } from '../shared/types';

// Payout cycle - represents a period for dividend distribution
export const payoutCycleSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,

  // Cycle information
  name: z.string(), // e.g., "Q1 2026 Dividends"
  periodStart: z.date(),
  periodEnd: z.date(),

  // Payout amounts
  totalAmount: moneySchema,
  totalGoldProduced: z.number().optional(), // in grams or ounces
  goldPriceAtCalculation: moneySchema.optional(),

  // Distribution
  tokensEligible: z.bigint(), // Total tokens eligible for this payout
  amountPerToken: moneySchema, // Calculated: totalAmount / tokensEligible

  // Status
  status: z.enum(['scheduled', 'processing', 'completed', 'failed', 'cancelled'] as const) as z.ZodType<PayoutStatus>,

  // Timestamps
  scheduledDate: z.date(),
  calculatedAt: z.date().optional(),
  distributionStartedAt: z.date().optional(),
  distributionCompletedAt: z.date().optional(),

  // Blockchain tracking
  distributionTxHash: z.string().optional(),
  distributionBlockNumber: z.bigint().optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayoutCycle = z.infer<typeof payoutCycleSchema>;

// Payout record - individual investor's payout from a cycle
export const payoutRecordSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  projectId: uuidSchema,
  cycleId: uuidSchema,
  investmentId: uuidSchema.optional(),

  // Entitlement
  tokensHeld: tokenAmountSchema,
  amountDue: moneySchema,

  // Status
  status: z.enum(['scheduled', 'processing', 'completed', 'failed', 'cancelled'] as const) as z.ZodType<PayoutStatus>,
  isClaimed: z.boolean().default(false),

  // Payment details
  paymentMethod: z.string().optional(), // 'wallet', 'bank_transfer', etc.
  paymentDestination: z.string().optional(), // Wallet address or bank account

  // Timestamps
  calculatedAt: z.date(),
  paidAt: z.date().optional(),
  claimedAt: z.date().optional(),

  // Blockchain tracking
  txHash: z.string().optional(),
  blockNumber: z.bigint().optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayoutRecord = z.infer<typeof payoutRecordSchema>;

// Claimable balance - aggregated view of user's unclaimed payouts
export const claimableBalanceSchema = z.object({
  userId: uuidSchema,
  projectId: uuidSchema.optional(),
  totalClaimable: moneySchema,
  recordCount: z.number(),
  oldestPayoutDate: z.date().optional(),
});

export type ClaimableBalance = z.infer<typeof claimableBalanceSchema>;

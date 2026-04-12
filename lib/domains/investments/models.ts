/**
 * Investments domain models
 */

import { z } from 'zod';
import { uuidSchema, moneySchema, tokenAmountSchema } from '../shared/schemas';
import type { InvestmentStatus } from '../shared/types';

// Investment model
export const investmentSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  projectId: uuidSchema,
  offeringId: uuidSchema.optional(),

  // Investment amounts
  amount: moneySchema,
  tokensPurchased: tokenAmountSchema,
  tokenPriceAtPurchase: moneySchema,

  // Status
  status: z.enum(['pending', 'completed', 'cancelled', 'refunded'] as const) as z.ZodType<InvestmentStatus>,

  // Blockchain tracking
  transactionHash: z.string().optional(),
  blockNumber: z.bigint().optional(),
  confirmed: z.boolean().default(false),

  // Timestamps
  investedAt: z.date(),
  completedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  refundedAt: z.date().optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Investment = z.infer<typeof investmentSchema>;

// Portfolio position - aggregated view of user's holdings in a project
export const portfolioPositionSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  projectId: uuidSchema,

  // Holdings
  totalTokens: tokenAmountSchema,
  totalInvested: moneySchema,
  averageTokenPrice: moneySchema,

  // Earnings
  totalDividendsReceived: moneySchema.default(0),
  totalDividendsPending: moneySchema.default(0),
  totalReturn: moneySchema.default(0),
  returnPercentage: z.number().default(0),

  // Status
  isActive: z.boolean().default(true),
  closedAt: z.date().optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PortfolioPosition = z.infer<typeof portfolioPositionSchema>;

// Create investment input
export const createInvestmentSchema = z.object({
  userId: uuidSchema,
  projectId: uuidSchema,
  offeringId: uuidSchema.optional(),
  amount: moneySchema,
  tokensPurchased: tokenAmountSchema,
});

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;

/**
 * Projects domain models
 */

import { z } from 'zod';
import { uuidSchema, moneySchema, futureDateSchema } from '../shared/schemas';
import type { ProjectStatus } from '../shared/types';

// Project model
export const projectSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),

  // Location
  location: z.string(),
  country: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Financial details
  fundingGoal: moneySchema,
  currentFunding: moneySchema.default(0),
  minInvestment: moneySchema.default(100),

  // Status
  status: z.enum(['draft', 'funding', 'funded', 'active', 'completed', 'cancelled'] as const) as z.ZodType<ProjectStatus>,

  // Project timeline
  startDate: z.date().optional(),
  expectedCompletionDate: z.date().optional(),
  actualCompletionDate: z.date().optional(),
  projectDurationMonths: z.number().optional(),

  // Expected returns
  expectedReturnPercentage: z.number().optional(),

  // Media
  images: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([]),
  videoUrl: z.string().optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof projectSchema>;

// Offering model - represents a tokenized investment opportunity for a project
export const offeringSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,

  // Token details
  tokenSymbol: z.string(), // e.g., "MINE-001"
  tokenName: z.string(), // e.g., "Ghana Mine Alpha"
  totalTokens: z.bigint(),
  availableTokens: z.bigint(),
  tokenPrice: moneySchema,
  tokenStandard: z.enum(['ERC20', 'ERC1400', 'custom']).default('ERC20'),

  // Offering period
  offeringStartDate: z.date(),
  offeringEndDate: z.date(),

  // Smart contract details (will be populated when deployed)
  contractAddress: z.string().optional(),
  chainId: z.number().optional(),
  deployedAt: z.date().optional(),

  // Status
  isActive: z.boolean().default(true),
  isClosed: z.boolean().default(false),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Offering = z.infer<typeof offeringSchema>;

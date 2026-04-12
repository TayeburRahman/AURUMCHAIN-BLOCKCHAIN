/**
 * Admin domain models
 */

import { z } from 'zod';
import { uuidSchema } from '../shared/schemas';
import type { AuditEventType, UserRole } from '../shared/types';

// Audit log model - immutable record of sensitive operations
export const auditLogSchema = z.object({
  id: uuidSchema,

  // Event information
  eventType: z.enum([
    'wallet_linked',
    'wallet_unlinked',
    'wallet_verified',
    'kyc_submitted',
    'kyc_approved',
    'kyc_rejected',
    'eligibility_changed',
    'investment_created',
    'investment_completed',
    'payout_created',
    'payout_completed',
    'admin_action',
    'account_suspended',
    'account_restricted',
  ] as const) as z.ZodType<AuditEventType>,

  // Actors
  userId: uuidSchema.optional(), // User affected
  actorId: uuidSchema.optional(), // Who performed the action (for admin actions)
  actorRole: z.enum(['user', 'admin', 'compliance_officer', 'super_admin'] as const).optional() as z.ZodType<UserRole | undefined>,

  // Event details
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),

  // Before/after state for critical changes
  previousState: z.record(z.string(), z.unknown()).optional(),
  newState: z.record(z.string(), z.unknown()).optional(),

  // Context
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),

  timestamp: z.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// User role model
export const userRoleSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  role: z.enum(['user', 'admin', 'compliance_officer', 'super_admin'] as const) as z.ZodType<UserRole>,
  grantedBy: uuidSchema.optional(),
  grantedAt: z.date(),
  revokedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserRoleModel = z.infer<typeof userRoleSchema>;

// Create audit log input
export const createAuditLogSchema = z.object({
  eventType: z.string() as z.ZodType<AuditEventType>,
  userId: uuidSchema.optional(),
  actorId: uuidSchema.optional(),
  actorRole: z.string().optional() as z.ZodType<UserRole | undefined>,
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  previousState: z.record(z.string(), z.unknown()).optional(),
  newState: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;

import { z } from 'zod';

/**
 * Zod schemas for Compliance Transfer Service
 * Following strict input validation rules.
 */

export const RecordVerifiedWalletSchema = z.object({
  wallet: z.string().regex(/^[A-HJ-NP-Za-km-z1-9]{32,44}$/, "Invalid Solana wallet address"),
  kycStatus: z.number().int().min(0).max(3), // 0=Pending, 1=Approved, 2=Rejected, 3=Expired
  amlStatus: z.number().int().min(0).max(2), // 0=Clear, 1=Flagged, 2=Blocked
  identityHash: z.array(z.number()).length(32),
  investmentAllowed: z.boolean(),
  transferAllowed: z.boolean(),
  expiryTimestamp: z.number().int().positive(),
});

export const RefreshEligibilitySchema = RecordVerifiedWalletSchema;

export const RevokeWalletSchema = z.object({
  wallet: z.string().regex(/^[A-HJ-NP-Za-km-z1-9]{32,44}$/, "Invalid Solana wallet address"),
});

export type RecordVerifiedWalletInput = z.infer<typeof RecordVerifiedWalletSchema>;
export type RevokeWalletInput = z.infer<typeof RevokeWalletSchema>;

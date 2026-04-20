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

export const SubscribeInvestmentSchema = z.object({
  subscriptionId: z.string(), // BN as string
  projectId: z.number().int().min(0),
  investmentAmount: z.string(), // BN as string
  paymentAsset: z.string().regex(/^[A-HJ-NP-Za-km-z1-9]{32,44}$/, "Invalid Mint address"),
});

export const FinalizeSubscriptionSchema = z.object({
  investor: z.string().regex(/^[A-HJ-NP-Za-km-z1-9]{32,44}$/, "Invalid Solana wallet address"),
  subscriptionId: z.string(),
  txHash: z.array(z.number()).length(64),
  tokenAmount: z.string(),
});

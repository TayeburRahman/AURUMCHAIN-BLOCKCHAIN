/**
 * Wallet domain models
 */

import { z } from 'zod';
import { walletAddressSchema, uuidSchema } from '../shared/schemas';

// Wallet link model - separates connection from verification
export const walletLinkSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  walletAddress: walletAddressSchema,
  chainId: z.number(),
  walletType: z.string().optional(), // metamask, coinbase, etc

  // Connection state
  connectedAt: z.date(),
  lastConnectedAt: z.date().optional(),

  // Verification state - separate from connection
  verified: z.boolean().default(false),
  verifiedAt: z.date().optional(),
  verificationNonce: z.string().optional(),
  verificationSignature: z.string().optional(),

  // Status
  isActive: z.boolean().default(true),
  disconnectedAt: z.date().optional(),

  // On-chain synchronized state (Solana Integrity)
  kycStatus: z.number().default(0),
  amlStatus: z.number().default(0),
  identityHash: z.string().optional(),
  canInvest: z.boolean().default(false),
  canTransfer: z.boolean().default(false),
  kycExpiry: z.date().optional(),
  onChainSyncedAt: z.date().optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletLink = z.infer<typeof walletLinkSchema>;

// Wallet link creation input
export const createWalletLinkSchema = z.object({
  userId: uuidSchema,
  walletAddress: walletAddressSchema,
  chainId: z.number(),
  walletType: z.string().optional(),
});

export type CreateWalletLinkInput = z.infer<typeof createWalletLinkSchema>;

// Wallet verification input
export const verifyWalletSchema = z.object({
  walletLinkId: uuidSchema,
  signature: z.string(),
  message: z.string(),
  nonce: z.string(),
});

export type VerifyWalletInput = z.infer<typeof verifyWalletSchema>;

-- Migration: Align wallet_links with Solana On-Chain Schema
-- Description: Adds fields to mirror the VerifiedWallet account on Solana for system integrity.

ALTER TABLE public.wallet_links 
ADD COLUMN IF NOT EXISTS kyc_status INTEGER DEFAULT 0, -- 0=None, 1=Approved, 2=Revoked
ADD COLUMN IF NOT EXISTS aml_status INTEGER DEFAULT 0, -- 0=Clear, 1=Flagged, 2=Blocked
ADD COLUMN IF NOT EXISTS identity_hash TEXT,           -- 32-byte hex hash
ADD COLUMN IF NOT EXISTS can_invest BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_transfer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS on_chain_synced_at TIMESTAMPTZ;

-- Add comment for integrity documentation
COMMENT ON COLUMN public.wallet_links.kyc_status IS 'Mirrors Solana VerifiedWallet.kyc_status';
COMMENT ON COLUMN public.wallet_links.aml_status IS 'Mirrors Solana VerifiedWallet.aml_status';
COMMENT ON COLUMN public.wallet_links.identity_hash IS 'Mirrors Solana VerifiedWallet.identity_hash';
COMMENT ON COLUMN public.wallet_links.on_chain_synced_at IS 'Last time database was verified against blockchain state';

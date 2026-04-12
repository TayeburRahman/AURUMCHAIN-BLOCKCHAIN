-- Migration: Reconcile profiles table with current implementation
-- This adds fields that exist in the current code but are missing from schema.sql

-- Add investor tier field (UI/segmentation only, NOT for access control)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS investor_tier TEXT DEFAULT 'browser' CHECK (investor_tier IN ('browser', 'investor', 'vip'));

-- Add crypto wallet fields (deprecated - will migrate to wallet_links table)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS crypto_wallet_type TEXT,
ADD COLUMN IF NOT EXISTS crypto_wallet_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wallet_verification_nonce TEXT;

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_crypto_wallet_address
ON public.profiles(crypto_wallet_address)
WHERE crypto_wallet_address IS NOT NULL;

-- Create index for investor tier
CREATE INDEX IF NOT EXISTS idx_profiles_investor_tier
ON public.profiles(investor_tier);

COMMENT ON COLUMN public.profiles.investor_tier IS 'UI/segmentation tier - do NOT use for access control. Use eligibility_states.can_invest instead.';
COMMENT ON COLUMN public.profiles.crypto_wallet_address IS 'DEPRECATED - migrating to wallet_links table for proper wallet management';

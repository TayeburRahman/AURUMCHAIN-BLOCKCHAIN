-- Migration: Add crypto wallet authentication fields
-- Description: Adds fields to support Web3 wallet connection for investor verification

-- Add crypto wallet fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crypto_wallet_type TEXT; -- 'metamask', 'coinbase', 'trust', 'rainbow', etc.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crypto_wallet_connected_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_verification_nonce TEXT; -- For signature verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investor_tier TEXT DEFAULT 'browser' CHECK (investor_tier IN ('browser', 'investor', 'vip'));

-- Create index for crypto wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_crypto_wallet ON public.profiles(crypto_wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_investor_tier ON public.profiles(investor_tier);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.crypto_wallet_address IS 'Ethereum/EVM wallet address for blockchain investments';
COMMENT ON COLUMN public.profiles.investor_tier IS 'browser: can browse only, investor: can invest, vip: premium features';

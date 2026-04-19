-- Migration: Update wallet_links for Solana compatibility
-- Description: relaxes the EVM-specific address constraint to support Solana Base58 addresses.

DO $$
BEGIN
    -- Drop the old EVM-specific constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallet_address_format') THEN
        ALTER TABLE public.wallet_links DROP CONSTRAINT wallet_address_format;
    END IF;

    -- Add a new constraint for Solana (Base58, 32-44 characters)
    -- This matches the standard Solana address format (alphanumeric, no O, I, l, 0)
    -- but we'll use a broader alphanumeric check for flexibility.
    ALTER TABLE public.wallet_links 
    ADD CONSTRAINT wallet_address_format 
    CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$');

    -- Update the comment
    COMMENT ON TABLE public.wallet_links IS 'Manages wallet connections (Solana/Base58 supported)';
END $$;

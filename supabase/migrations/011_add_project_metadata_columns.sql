-- Migration: Add missing metadata columns for robust project recovery
-- These columns act as a secondary fallback for on-chain project metadata

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS token_symbol TEXT,
ADD COLUMN IF NOT EXISTS metadata_uri TEXT,
ADD COLUMN IF NOT EXISTS lockup_end_date TIMESTAMPTZ;

-- Add a comment explaining the purpose of these columns
COMMENT ON COLUMN projects.token_symbol IS 'Fallback token symbol for on-chain projects (redundant storage)';
COMMENT ON COLUMN projects.metadata_uri IS 'Fallback IPFS/Metadata URL for on-chain projects (redundant storage)';
COMMENT ON COLUMN projects.lockup_end_date IS 'Fallback lock-up date for investors (redundant storage)';

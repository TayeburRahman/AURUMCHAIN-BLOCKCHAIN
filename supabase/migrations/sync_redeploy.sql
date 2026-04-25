-- =============================================================================
-- FIXED FINAL SYNC: AURUMCHAIN REDEPLOYMENT
-- Description: Total alignment between Blockchain Structs and Supabase Schema
-- =============================================================================

-- 1. SYNC PROJECT STATUS ENUM
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('draft', 'funding', 'funded', 'active', 'completed', 'canceled');
    ELSE
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'funded';
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'canceled';
    END IF;
END $$;

-- 2. SYNC PROJECTS TABLE
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS on_chain_id BIGINT,
ADD COLUMN IF NOT EXISTS mint_address TEXT,
ADD COLUMN IF NOT EXISTS token_price_usdc BIGINT DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS distribution_cadence INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS distribution_mode INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 12;

-- 3. SYNC SUBSCRIPTION STATUS ENUM
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('pending', 'settled', 'allocated', 'refunded');
    END IF;
END $$;

-- 4. SYNC SUBSCRIPTIONS TABLE (Created if missing)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id BIGINT UNIQUE NOT NULL,
    investor_wallet TEXT NOT NULL,
    project_id BIGINT NOT NULL,
    investment_amount BIGINT NOT NULL,
    payment_asset TEXT,
    status subscription_status DEFAULT 'pending',
    settlement_tx_hash TEXT,
    allocated_token_amount BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- Ensure columns exist if table was already there but missing new fields
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS allocated_token_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS settlement_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_on_chain_id ON public.projects(on_chain_id);
CREATE INDEX IF NOT EXISTS idx_projects_mint_address ON public.projects(mint_address);
CREATE INDEX IF NOT EXISTS idx_subs_project_id ON public.subscriptions(project_id);

-- 6. DOCUMENTATION COMMENTS
COMMENT ON COLUMN public.projects.token_price_usdc IS 'Blockchain Truth: Investment / Price = Tokens';
COMMENT ON COLUMN public.projects.distribution_mode IS '0=Parallel, 1=Sequential';
COMMENT ON TABLE public.projects IS 'Synchronized with project_registry v2.0 (600-byte PDA)';
-- 7. SYNC COMPLIANCE ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
        CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aml_status') THEN
        CREATE TYPE aml_status AS ENUM ('clear', 'flagged', 'blocked');
    END IF;
END $$;

-- 8. SYNC INVESTOR ELIGIBILITY (Update profiles/users table)
-- We assume your user table is called 'profiles' or 'investors'. 
-- We add the compliance flags here.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_status kyc_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS aml_status aml_status DEFAULT 'clear',
ADD COLUMN IF NOT EXISTS investment_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transfer_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lockup_bypass BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- 9. SYNC COMPLIANCE CONTROL (Global Settings)
CREATE TABLE IF NOT EXISTS public.compliance_control (
    id INTEGER PRIMARY KEY DEFAULT 1,
    authority_address TEXT,
    registry_program_id TEXT,
    is_paused BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_row CHECK (id = 1)
);

COMMENT ON TABLE public.compliance_control IS 'Mirror of the on-chain ComplianceControl account';
-- 10. SYNC DISTRIBUTION EPOCHS (Rounds)
CREATE TABLE IF NOT EXISTS public.distribution_epochs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id BIGINT NOT NULL,
    epoch_id BIGINT NOT NULL,
    profit_per_token BIGINT NOT NULL,
    record_date TIMESTAMPTZ DEFAULT NOW(),
    total_payouts_executed BIGINT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(project_id, epoch_id)
);

-- 11. SYNC PAYOUTS TABLE (Individual Investor Records)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epoch_id UUID REFERENCES public.distribution_epochs(id),
    investor_wallet TEXT NOT NULL,
    amount_paid BIGINT NOT NULL,
    payout_timestamp TIMESTAMPTZ DEFAULT NOW(),
    tx_hash TEXT
);

-- 12. SYNC DISTRIBUTION CONTROL (Global Settings)
CREATE TABLE IF NOT EXISTS public.distribution_control (
    id INTEGER PRIMARY KEY DEFAULT 1,
    admin_address TEXT,
    is_paused BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_row_dist CHECK (id = 1)
);

-- 13. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_payouts_investor ON public.payouts(investor_wallet);
CREATE INDEX IF NOT EXISTS idx_epochs_project ON public.distribution_epochs(project_id);

COMMENT ON TABLE public.distribution_epochs IS 'Mirror of the on-chain DistributionEpoch account';
COMMENT ON TABLE public.payouts IS 'Mirror of the on-chain PayoutRecord account';

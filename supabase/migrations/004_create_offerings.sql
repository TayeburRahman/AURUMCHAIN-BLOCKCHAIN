-- Migration: Create offerings table for tokenized investment opportunities

CREATE TABLE IF NOT EXISTS public.offerings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,

  -- Token details
  token_symbol TEXT NOT NULL, -- e.g., "MINE-001"
  token_name TEXT NOT NULL, -- e.g., "Ghana Mine Alpha"
  total_tokens BIGINT NOT NULL CHECK (total_tokens > 0),
  available_tokens BIGINT NOT NULL CHECK (available_tokens >= 0),
  token_price DECIMAL(15, 2) NOT NULL CHECK (token_price > 0),
  token_standard TEXT DEFAULT 'ERC20' CHECK (token_standard IN ('ERC20', 'ERC1400', 'custom')) NOT NULL,

  -- Offering period
  offering_start_date TIMESTAMPTZ NOT NULL,
  offering_end_date TIMESTAMPTZ NOT NULL,

  -- Smart contract details (populated when deployed)
  contract_address TEXT,
  chain_id INTEGER,
  deployed_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_offering_period CHECK (offering_end_date > offering_start_date),
  CONSTRAINT valid_token_availability CHECK (available_tokens <= total_tokens),
  CONSTRAINT contract_address_format CHECK (
    contract_address IS NULL OR contract_address ~* '^0x[a-f0-9]{40}$'
  )
);

-- Indexes
CREATE INDEX idx_offerings_project_id ON public.offerings(project_id);
CREATE INDEX idx_offerings_active ON public.offerings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_offerings_contract_address ON public.offerings(contract_address)
  WHERE contract_address IS NOT NULL;
CREATE INDEX idx_offerings_period ON public.offerings(offering_start_date, offering_end_date);

-- RLS policies
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offerings"
  ON public.offerings FOR SELECT
  USING (is_active = TRUE AND NOT is_closed);

-- Trigger
CREATE TRIGGER update_offerings_updated_at
  BEFORE UPDATE ON public.offerings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add offering_id to investments table
ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS offering_id UUID REFERENCES public.offerings(id);

CREATE INDEX IF NOT EXISTS idx_investments_offering_id ON public.investments(offering_id);

COMMENT ON TABLE public.offerings IS 'Tokenized investment opportunities for projects';

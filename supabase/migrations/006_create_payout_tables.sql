-- Migration: Create payout cycles and records tables

-- Payout cycles - represents a dividend distribution period
CREATE TABLE IF NOT EXISTS public.payout_cycles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,

  -- Cycle information
  name TEXT NOT NULL, -- e.g., "Q1 2026 Dividends"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Payout amounts
  total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount > 0),
  total_gold_produced DECIMAL(15, 4), -- in grams or ounces
  gold_price_at_calculation DECIMAL(15, 2),

  -- Distribution calculation
  tokens_eligible BIGINT NOT NULL CHECK (tokens_eligible > 0),
  amount_per_token DECIMAL(15, 8) NOT NULL CHECK (amount_per_token > 0),

  -- Status
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL,

  -- Timestamps
  scheduled_date DATE NOT NULL,
  calculated_at TIMESTAMPTZ,
  distribution_started_at TIMESTAMPTZ,
  distribution_completed_at TIMESTAMPTZ,

  -- Blockchain tracking
  distribution_tx_hash TEXT,
  distribution_block_number BIGINT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT valid_calculation CHECK (amount_per_token = total_amount / tokens_eligible)
);

-- Payout records - individual investor payouts from a cycle
CREATE TABLE IF NOT EXISTS public.payout_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID REFERENCES public.payout_cycles(id) ON DELETE CASCADE NOT NULL,
  investment_id UUID REFERENCES public.investments(id),

  -- Entitlement
  tokens_held DECIMAL(15, 8) NOT NULL CHECK (tokens_held > 0),
  amount_due DECIMAL(15, 2) NOT NULL CHECK (amount_due > 0),

  -- Status
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE NOT NULL,

  -- Payment details
  payment_method TEXT, -- 'wallet', 'bank_transfer', etc
  payment_destination TEXT,

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,

  -- Blockchain tracking
  tx_hash TEXT,
  block_number BIGINT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(cycle_id, user_id) -- One record per user per cycle
);

-- Indexes
CREATE INDEX idx_payout_cycles_project_id ON public.payout_cycles(project_id);
CREATE INDEX idx_payout_cycles_status ON public.payout_cycles(status);
CREATE INDEX idx_payout_cycles_scheduled_date ON public.payout_cycles(scheduled_date);

CREATE INDEX idx_payout_records_user_id ON public.payout_records(user_id);
CREATE INDEX idx_payout_records_project_id ON public.payout_records(project_id);
CREATE INDEX idx_payout_records_cycle_id ON public.payout_records(cycle_id);
CREATE INDEX idx_payout_records_unclaimed ON public.payout_records(is_claimed, status)
  WHERE is_claimed = FALSE AND status = 'completed';

-- RLS policies
ALTER TABLE public.payout_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payout cycles"
  ON public.payout_cycles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can view own payout records"
  ON public.payout_records FOR SELECT
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_payout_cycles_updated_at
  BEFORE UPDATE ON public.payout_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_records_updated_at
  BEFORE UPDATE ON public.payout_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update portfolio position dividends when payout is completed
CREATE OR REPLACE FUNCTION update_portfolio_dividends_on_payout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.portfolio_positions
    SET
      total_dividends_received = total_dividends_received + NEW.amount_due,
      total_return = total_return + NEW.amount_due,
      return_percentage = ((total_return + NEW.amount_due) / NULLIF(total_invested, 0)) * 100,
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND project_id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payout_completed_update_portfolio
  AFTER UPDATE ON public.payout_records
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_dividends_on_payout();

COMMENT ON TABLE public.payout_cycles IS 'Dividend distribution periods for projects';
COMMENT ON TABLE public.payout_records IS 'Individual investor payout records with claim tracking';

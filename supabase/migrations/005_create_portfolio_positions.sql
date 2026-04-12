-- Migration: Create portfolio_positions table for aggregated holdings view

CREATE TABLE IF NOT EXISTS public.portfolio_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,

  -- Holdings (aggregated from investments)
  total_tokens DECIMAL(15, 8) DEFAULT 0 NOT NULL CHECK (total_tokens >= 0),
  total_invested DECIMAL(15, 2) DEFAULT 0 NOT NULL CHECK (total_invested >= 0),
  average_token_price DECIMAL(15, 2) DEFAULT 0 NOT NULL,

  -- Earnings (aggregated from dividends/payouts)
  total_dividends_received DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  total_dividends_pending DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  total_return DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  return_percentage DECIMAL(10, 4) DEFAULT 0 NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  closed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(user_id, project_id)
);

-- Indexes
CREATE INDEX idx_portfolio_positions_user_id ON public.portfolio_positions(user_id);
CREATE INDEX idx_portfolio_positions_project_id ON public.portfolio_positions(project_id);
CREATE INDEX idx_portfolio_positions_active ON public.portfolio_positions(is_active)
  WHERE is_active = TRUE;

-- RLS policies
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio positions"
  ON public.portfolio_positions FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_portfolio_positions_updated_at
  BEFORE UPDATE ON public.portfolio_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update portfolio position when investment is completed
CREATE OR REPLACE FUNCTION update_portfolio_position_on_investment()
RETURNS TRIGGER AS $$
DECLARE
  position_exists BOOLEAN;
BEGIN
  -- Only process completed investments
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Check if position exists
    SELECT EXISTS(
      SELECT 1 FROM public.portfolio_positions
      WHERE user_id = NEW.user_id AND project_id = NEW.project_id
    ) INTO position_exists;

    IF position_exists THEN
      -- Update existing position
      UPDATE public.portfolio_positions
      SET
        total_tokens = total_tokens + NEW.tokens_purchased,
        total_invested = total_invested + NEW.amount,
        average_token_price = (total_invested + NEW.amount) / (total_tokens + NEW.tokens_purchased),
        updated_at = NOW()
      WHERE user_id = NEW.user_id AND project_id = NEW.project_id;
    ELSE
      -- Create new position
      INSERT INTO public.portfolio_positions (
        user_id, project_id, total_tokens, total_invested, average_token_price
      ) VALUES (
        NEW.user_id, NEW.project_id, NEW.tokens_purchased, NEW.amount, NEW.token_price_at_purchase
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_investment_completed_update_portfolio
  AFTER INSERT OR UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_position_on_investment();

COMMENT ON TABLE public.portfolio_positions IS 'Aggregated view of user holdings per project';

-- Migration: Create wallet_links table
-- Separates wallet connection from verification state

CREATE TABLE IF NOT EXISTS public.wallet_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Wallet details
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  wallet_type TEXT, -- metamask, coinbase, etc

  -- Connection state
  connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_connected_at TIMESTAMPTZ,

  -- Verification state (separate from connection)
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_at TIMESTAMPTZ,
  verification_nonce TEXT,
  verification_signature TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  disconnected_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT wallet_address_format CHECK (wallet_address ~* '^0x[a-f0-9]{40}$'),
  CONSTRAINT unique_active_wallet_per_user UNIQUE (user_id, wallet_address)
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_wallet_links_user_id ON public.wallet_links(user_id);
CREATE INDEX idx_wallet_links_wallet_address ON public.wallet_links(wallet_address);
CREATE INDEX idx_wallet_links_verified ON public.wallet_links(verified) WHERE verified = TRUE;
CREATE INDEX idx_wallet_links_active ON public.wallet_links(is_active) WHERE is_active = TRUE;

-- RLS policies
ALTER TABLE public.wallet_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet links"
  ON public.wallet_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet links"
  ON public.wallet_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet links"
  ON public.wallet_links FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_wallet_links_updated_at
  BEFORE UPDATE ON public.wallet_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.wallet_links IS 'Manages wallet connections with separate verification state';

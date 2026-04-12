-- Migration: Create KYC and compliance tables

-- KYC Profiles table
CREATE TABLE IF NOT EXISTS public.kyc_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Provider information
  provider TEXT DEFAULT 'sumsub' CHECK (provider IN ('sumsub', 'manual', 'other')) NOT NULL,
  provider_applicant_id TEXT, -- Sumsub applicant ID or other provider ID

  -- Status
  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'pending', 'under_review', 'approved', 'rejected', 'expired')) NOT NULL,

  -- Personal information (encrypted at rest recommended)
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  nationality TEXT,

  -- Document information
  document_type TEXT,
  document_number TEXT,
  document_country TEXT,

  -- Review information
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Reviewer notes (for manual/compliance review)
  reviewer_notes TEXT,
  reviewer_id UUID REFERENCES public.profiles(id),

  -- Rejection details
  rejection_reason TEXT,
  rejection_code TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Eligibility States table - the source of truth for investment access
CREATE TABLE IF NOT EXISTS public.eligibility_states (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Eligibility status (state machine)
  status TEXT DEFAULT 'registered'
    CHECK (status IN (
      'registered', 'wallet_connected', 'wallet_verified',
      'kyc_pending', 'kyc_under_review', 'kyc_approved', 'kyc_rejected',
      'investment_eligible', 'restricted', 'suspended'
    )) NOT NULL,

  -- Permission flags (derived from status but cached for performance)
  can_invest BOOLEAN DEFAULT FALSE NOT NULL,
  can_withdraw BOOLEAN DEFAULT FALSE NOT NULL,
  can_receive_dividends BOOLEAN DEFAULT FALSE NOT NULL,

  -- Restriction information
  restriction_reason TEXT,
  restricted_at TIMESTAMPTZ,
  restricted_until TIMESTAMPTZ,

  -- State transition tracking
  previous_status TEXT,
  status_changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status_changed_by UUID REFERENCES public.profiles(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_kyc_profiles_user_id ON public.kyc_profiles(user_id);
CREATE INDEX idx_kyc_profiles_status ON public.kyc_profiles(status);
CREATE INDEX idx_kyc_profiles_provider_applicant_id ON public.kyc_profiles(provider_applicant_id)
  WHERE provider_applicant_id IS NOT NULL;

CREATE INDEX idx_eligibility_states_user_id ON public.eligibility_states(user_id);
CREATE INDEX idx_eligibility_states_status ON public.eligibility_states(status);
CREATE INDEX idx_eligibility_states_can_invest ON public.eligibility_states(can_invest) WHERE can_invest = TRUE;

-- RLS policies
ALTER TABLE public.kyc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC profile"
  ON public.kyc_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own eligibility state"
  ON public.eligibility_states FOR SELECT
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_kyc_profiles_updated_at
  BEFORE UPDATE ON public.kyc_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eligibility_states_updated_at
  BEFORE UPDATE ON public.eligibility_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create eligibility state on profile creation
CREATE OR REPLACE FUNCTION create_eligibility_state_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.eligibility_states (user_id, status, can_invest, can_withdraw, can_receive_dividends)
  VALUES (NEW.id, 'registered', FALSE, FALSE, FALSE)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_eligibility
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_eligibility_state_for_user();

COMMENT ON TABLE public.kyc_profiles IS 'KYC verification data with Sumsub integration support';
COMMENT ON TABLE public.eligibility_states IS 'Source of truth for user investment eligibility - use can_invest instead of investor_tier';

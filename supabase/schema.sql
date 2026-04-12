-- GoldenFleece Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & PROFILES
-- ============================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  avatar_url TEXT,
  kyc_verified BOOLEAN DEFAULT FALSE,
  kyc_submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User wallets
CREATE TABLE public.wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  gold_tokens DECIMAL(15, 8) DEFAULT 0.00 NOT NULL CHECK (gold_tokens >= 0),
  wallet_address TEXT, -- For blockchain integration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- MINING PROJECTS
-- ============================================

CREATE TYPE project_status AS ENUM ('draft', 'funding', 'funded', 'active', 'completed', 'cancelled');

CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Financial details
  funding_goal DECIMAL(15, 2) NOT NULL CHECK (funding_goal > 0),
  current_funding DECIMAL(15, 2) DEFAULT 0.00 NOT NULL CHECK (current_funding >= 0),
  min_investment DECIMAL(15, 2) DEFAULT 100.00 NOT NULL,
  token_price DECIMAL(15, 2) NOT NULL,
  total_tokens BIGINT NOT NULL,
  available_tokens BIGINT NOT NULL,

  -- Project details
  expected_return_percentage DECIMAL(5, 2),
  project_duration_months INTEGER,
  start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,

  -- Status
  status project_status DEFAULT 'draft' NOT NULL,

  -- Metadata
  images TEXT[], -- Array of image URLs
  documents TEXT[], -- Array of document URLs
  video_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVESTMENTS
-- ============================================

CREATE TYPE investment_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');

CREATE TABLE public.investments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,

  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  tokens_purchased DECIMAL(15, 8) NOT NULL CHECK (tokens_purchased > 0),
  token_price_at_purchase DECIMAL(15, 2) NOT NULL,

  status investment_status DEFAULT 'pending' NOT NULL,

  transaction_hash TEXT, -- Blockchain transaction hash

  invested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'investment', 'dividend', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('credit_card', 'bank_transfer', 'cryptocurrency', 'wallet_balance');

CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,

  type transaction_type NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),

  status transaction_status DEFAULT 'pending' NOT NULL,
  payment_method payment_method,

  description TEXT,

  -- Blockchain integration
  blockchain_hash TEXT,
  blockchain_confirmed BOOLEAN DEFAULT FALSE,

  -- Payment processor details
  payment_processor_id TEXT,
  payment_processor_data JSONB,

  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DIVIDENDS
-- ============================================

CREATE TYPE dividend_status AS ENUM ('pending', 'processing', 'paid', 'failed');

CREATE TABLE public.dividends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,

  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  tokens_held DECIMAL(15, 8) NOT NULL,

  status dividend_status DEFAULT 'pending' NOT NULL,

  payment_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,

  transaction_id UUID REFERENCES public.transactions(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KYC DOCUMENTS
-- ============================================

CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('passport', 'drivers_license', 'national_id', 'proof_of_address', 'selfie');

CREATE TABLE public.kyc_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,

  status kyc_status DEFAULT 'pending' NOT NULL,

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TYPE notification_type AS ENUM ('investment', 'dividend', 'project_update', 'kyc', 'system', 'security');

CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  link TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_kyc_verified ON public.profiles(kyc_verified);

-- Wallets
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- Projects
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_location ON public.projects(country, location);

-- Investments
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_project_id ON public.investments(project_id);
CREATE INDEX idx_investments_status ON public.investments(status);
CREATE INDEX idx_investments_invested_at ON public.investments(invested_at DESC);

-- Transactions
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Dividends
CREATE INDEX idx_dividends_user_id ON public.dividends(user_id);
CREATE INDEX idx_dividends_project_id ON public.dividends(project_id);
CREATE INDEX idx_dividends_payment_date ON public.dividends(payment_date);
CREATE INDEX idx_dividends_status ON public.dividends(status);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Wallets: Users can only see their own wallet
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Projects: Everyone can view active projects
CREATE POLICY "Anyone can view active projects"
  ON public.projects FOR SELECT
  USING (status IN ('funding', 'funded', 'active', 'completed'));

-- Investments: Users can only see their own investments
CREATE POLICY "Users can view own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

-- Transactions: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Dividends: Users can only see their own dividends
CREATE POLICY "Users can view own dividends"
  ON public.dividends FOR SELECT
  USING (auth.uid() = user_id);

-- KYC Documents: Users can only see their own documents
CREATE POLICY "Users can view own KYC documents"
  ON public.kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC documents"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividends_updated_at BEFORE UPDATE ON public.dividends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and wallet on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update project funding
CREATE OR REPLACE FUNCTION update_project_funding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.projects
    SET
      current_funding = current_funding + NEW.amount,
      available_tokens = available_tokens - NEW.tokens_purchased
    WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_investment_completed
  AFTER INSERT OR UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION update_project_funding();

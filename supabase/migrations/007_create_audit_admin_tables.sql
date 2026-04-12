-- Migration: Create audit logs and admin tables

-- Audit logs - immutable record of sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Event information
  event_type TEXT NOT NULL CHECK (event_type IN (
    'wallet_linked', 'wallet_unlinked', 'wallet_verified',
    'kyc_submitted', 'kyc_approved', 'kyc_rejected',
    'eligibility_changed', 'investment_created', 'investment_completed',
    'payout_created', 'payout_completed',
    'admin_action', 'account_suspended', 'account_restricted'
  )),

  -- Actors
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IN ('user', 'admin', 'compliance_officer', 'super_admin')),

  -- Event details
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Before/after state for critical changes
  previous_state JSONB,
  new_state JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,

  -- Timestamp (immutable)
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Make audit_logs append-only (no updates or deletes)
CREATE POLICY "audit_logs_append_only" ON public.audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'compliance_officer', 'super_admin')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(user_id, role, revoked_at) -- Can't have duplicate active roles
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_active ON public.user_roles(revoked_at) WHERE revoked_at IS NULL;

-- RLS policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND revoked_at IS NULL
    )
  );

-- Users can view own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to check if user has a role
CREATE OR REPLACE FUNCTION has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = check_role
      AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log(
  p_event_type TEXT,
  p_user_id UUID,
  p_description TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_previous_state JSONB DEFAULT NULL,
  p_new_state JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    event_type, user_id, actor_id, actor_role,
    description, metadata, previous_state, new_state
  ) VALUES (
    p_event_type, p_user_id, p_actor_id, p_actor_role,
    p_description, p_metadata, p_previous_state, p_new_state
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of sensitive operations';
COMMENT ON TABLE public.user_roles IS 'Role-based access control for admin functions';

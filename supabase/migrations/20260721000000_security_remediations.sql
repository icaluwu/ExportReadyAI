-- ============================================================
-- Migration: Security Remediations (Rate Limiting, Configurable Admins, Expiries)
-- ============================================================

-- 1. Rate Limiting Table and Helper
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_key text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_key_endpoint_idx ON public.rate_limits(rate_key, endpoint);
CREATE INDEX IF NOT EXISTS rate_limits_created_at_idx ON public.rate_limits(created_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_rate_key text,
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Clean up expired entries for this endpoint
  DELETE FROM public.rate_limits 
  WHERE endpoint = p_endpoint 
    AND created_at < now() - (p_window_seconds || ' seconds')::interval;

  -- Count current entries
  SELECT count(*) INTO v_count
  FROM public.rate_limits
  WHERE rate_key = p_rate_key AND endpoint = p_endpoint;

  -- Check limit
  IF v_count >= p_limit THEN
    RETURN TRUE; -- Rate limited
  END IF;

  -- Insert new entry
  INSERT INTO public.rate_limits (rate_key, endpoint)
  VALUES (p_rate_key, p_endpoint);

  RETURN FALSE; -- Not rate limited
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated, anon;


-- 2. Configurable Admin Table
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Seed default admin email
INSERT INTO public.admin_emails (email)
VALUES ('teukuvaickal@export-ready-ai.vercel.app')
ON CONFLICT (email) DO NOTHING;

-- Update existing user's profile to admin if email exists in admin_emails table
UPDATE public.profiles
SET account_type = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (SELECT email FROM public.admin_emails)
);


-- 3. Update handle_new_user trigger to use admin_emails table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_email boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = NEW.email
  ) INTO is_admin_email;

  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN is_admin_email THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    account_type = CASE 
      WHEN is_admin_email THEN 'admin'
      ELSE public.profiles.account_type
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Share Token Expiry Remediations
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS share_token_expires_at timestamptz;

-- Update get_shared_assessment RPC to respect expiry date
CREATE OR REPLACE FUNCTION get_shared_assessment(token uuid)
RETURNS TABLE (
  id uuid,
  product_name text,
  category text,
  readiness_score integer,
  score_breakdown jsonb,
  ai_result jsonb,
  target_markets text[],
  created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    id,
    product_name,
    category,
    readiness_score,
    score_breakdown,
    ai_result,
    target_markets,
    created_at
  FROM assessments
  WHERE share_token = token 
    AND (share_token_expires_at IS NULL OR share_token_expires_at > now());
$$;


-- 5. Database-level Subscription Expiry Helper
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active' AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

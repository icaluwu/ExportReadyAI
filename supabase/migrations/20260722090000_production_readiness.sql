BEGIN;

-- Public profile data must not expose phone numbers, verification state, or role controls.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false)
AS
SELECT id, username, full_name, bio, avatar_url, account_type
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND account_type = ANY (p_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_role(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text[]) TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_emails FROM PUBLIC, anon, authenticated;

-- Registration metadata is user-controlled and must never assign a privileged role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text := 'user';
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), v_role)
  ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Admins can read any profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.user_has_role((SELECT auth.uid()), ARRAY['admin']));

CREATE POLICY "Users can update safe own profile fields"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (
  username, full_name, bio, avatar_url, phone_number,
  social_instagram, social_twitter, social_linkedin, social_github, social_website
) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.user_has_role(auth.uid(), ARRAY['admin']) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF p_role NOT IN ('user', 'editor', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles SET account_type = p_role WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Users can update own editor applications" ON public.editor_applications;
DROP POLICY IF EXISTS "Users can create editor applications" ON public.editor_applications;
DROP POLICY IF EXISTS "Admins can read editor applications" ON public.editor_applications;
DROP POLICY IF EXISTS "Admins can review editor applications" ON public.editor_applications;

CREATE POLICY "Users can create pending editor applications"
  ON public.editor_applications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND rejection_reason IS NULL
  );

CREATE POLICY "Admins can read editor applications"
  ON public.editor_applications FOR SELECT TO authenticated
  USING (public.user_has_role((SELECT auth.uid()), ARRAY['admin']));

CREATE POLICY "Admins can review editor applications"
  ON public.editor_applications FOR UPDATE TO authenticated
  USING (public.user_has_role((SELECT auth.uid()), ARRAY['admin']))
  WITH CHECK (public.user_has_role((SELECT auth.uid()), ARRAY['admin']));

DROP POLICY IF EXISTS "Editors can read own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Editors can create posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Editors can update own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Editors can delete own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update any blog post" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete any blog post" ON public.blog_posts;

CREATE POLICY "Editors can read own posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND public.user_has_role((SELECT auth.uid()), ARRAY['editor', 'admin'])
  );

CREATE POLICY "Editors can create posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND public.user_has_role((SELECT auth.uid()), ARRAY['editor', 'admin'])
  );

CREATE POLICY "Editors can update own posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND public.user_has_role((SELECT auth.uid()), ARRAY['editor', 'admin'])
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND public.user_has_role((SELECT auth.uid()), ARRAY['editor', 'admin'])
  );

CREATE POLICY "Editors can delete own posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND public.user_has_role((SELECT auth.uid()), ARRAY['editor', 'admin'])
  );

CREATE POLICY "Admins can update any blog post"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.user_has_role((SELECT auth.uid()), ARRAY['admin']))
  WITH CHECK (public.user_has_role((SELECT auth.uid()), ARRAY['admin']));

CREATE POLICY "Admins can delete any blog post"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (public.user_has_role((SELECT auth.uid()), ARRAY['admin']));

DROP POLICY IF EXISTS "Guests can read guest assessments" ON public.assessments;
DROP POLICY IF EXISTS "Guests can view guest assessments" ON public.assessments;
DROP POLICY IF EXISTS "Guests can insert guest assessments" ON public.assessments;
DROP POLICY IF EXISTS "Guests can insert assessments" ON public.assessments;
REVOKE ALL ON public.assessments FROM anon;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS share_token_expires_at timestamptz;

UPDATE public.assessments
SET share_token_expires_at = LEAST(created_at + interval '30 days', now() + interval '30 days')
WHERE share_token IS NOT NULL AND share_token_expires_at IS NULL;

CREATE OR REPLACE FUNCTION public.mask_free_ai_result(p_ai_result jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(p_ai_result, '{}'::jsonb),
        '{topCountries}',
        CASE
          WHEN jsonb_typeof(p_ai_result->'topCountries') = 'array'
            AND jsonb_array_length(p_ai_result->'topCountries') > 0
          THEN jsonb_build_array(p_ai_result->'topCountries'->0)
            || jsonb_build_array(jsonb_build_object(
              'country', 'Negara Premium', 'flag', '🔒', 'demandLevel', 'Premium',
              'reason', 'Buka paket Premium untuk melihat rekomendasi lainnya.'
            ))
          ELSE '[]'::jsonb
        END,
        true
      ),
      '{roadmap,fase3}',
      '["Langkah premium dikunci."]'::jsonb,
      true
    ),
    '{roadmap,fase4}',
    '["Langkah premium dikunci."]'::jsonb,
    true
  );
$$;

REVOKE ALL ON FUNCTION public.mask_free_ai_result(jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_shared_assessment(token uuid)
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id,
    a.product_name,
    a.category,
    a.readiness_score,
    a.score_breakdown,
    public.mask_free_ai_result(a.ai_result),
    a.target_markets,
    a.created_at
  FROM public.assessments a
  WHERE a.share_token = token
    AND a.status = 'completed'
    AND a.share_token_expires_at > now();
$$;

REVOKE ALL ON FUNCTION public.get_shared_assessment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_assessment(uuid) TO anon, authenticated;

-- SECURITY DEFINER functions should never inherit PUBLIC execute privileges.
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_users_for_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_users_for_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.activate_subscription_on_settlement() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.is_admin(uuid) SET search_path = '';
ALTER FUNCTION public.get_users_for_admin() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.handle_blog_post_publish() SET search_path = '';
ALTER FUNCTION public.activate_subscription_on_settlement() SET search_path = '';
ALTER FUNCTION public.match_regulation_chunks(vector, integer) SET search_path = '';


CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_key text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_key_endpoint_idx
  ON public.rate_limits(rate_key, endpoint);
CREATE INDEX IF NOT EXISTS rate_limits_endpoint_created_idx
  ON public.rate_limits(endpoint, created_at);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_rate_key text,
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 OR length(p_rate_key) <> 64 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_endpoint || ':' || p_rate_key, 0));

  DELETE FROM public.rate_limits
  WHERE endpoint = p_endpoint
    AND created_at < now() - make_interval(secs => p_window_seconds);

  SELECT count(*) INTO v_count
  FROM public.rate_limits
  WHERE rate_key = p_rate_key
    AND endpoint = p_endpoint;

  IF v_count >= p_limit THEN
    RETURN true;
  END IF;

  INSERT INTO public.rate_limits (rate_key, endpoint)
  VALUES (p_rate_key, p_endpoint);
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.activate_subscription_on_settlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan_name text;
  v_duration_days integer;
  v_subscription_id uuid;
  v_current_expiry timestamptz;
BEGIN
  IF NEW.status <> 'settlement'
    OR (TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'settlement') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE midtrans_order_id = NEW.order_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_plan_name
  FROM public.subscription_plans
  WHERE id = NEW.plan_id AND is_active = true;

  IF v_plan_name NOT IN ('premium_monthly', 'premium_yearly') THEN
    RAISE EXCEPTION 'Invalid subscription plan';
  END IF;

  v_duration_days := CASE WHEN v_plan_name = 'premium_yearly' THEN 365 ELSE 30 END;

  SELECT id, expires_at
  INTO v_subscription_id, v_current_expiry
  FROM public.user_subscriptions
  WHERE user_id = NEW.user_id AND status = 'active'
  ORDER BY expires_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_subscription_id IS NULL THEN
    INSERT INTO public.user_subscriptions (
      user_id, plan_id, status, started_at, expires_at, midtrans_order_id
    ) VALUES (
      NEW.user_id, NEW.plan_id, 'active', now(),
      now() + make_interval(days => v_duration_days), NEW.order_id
    );
  ELSE
    UPDATE public.user_subscriptions
    SET plan_id = NEW.plan_id,
        expires_at = GREATEST(v_current_expiry, now()) + make_interval(days => v_duration_days),
        midtrans_order_id = NEW.order_id,
        updated_at = now()
    WHERE id = v_subscription_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_subscription_on_settlement()
  FROM PUBLIC, anon, authenticated;
COMMIT;

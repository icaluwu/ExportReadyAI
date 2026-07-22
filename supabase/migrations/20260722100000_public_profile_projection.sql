BEGIN;

DROP VIEW IF EXISTS public.public_profiles;

CREATE TABLE public.public_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  username text,
  full_name text,
  bio text,
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.public_profiles (id, username, full_name, bio, avatar_url)
SELECT id, username, full_name, bio, avatar_url
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = now();

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are readable"
  ON public.public_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.public_profiles (id, username, full_name, bio, avatar_url, updated_at)
  VALUES (NEW.id, NEW.username, NEW.full_name, NEW.bio, NEW.avatar_url, now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_public_profile() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS profiles_sync_public_projection ON public.profiles;
CREATE TRIGGER profiles_sync_public_projection
  AFTER INSERT OR UPDATE OF username, full_name, bio, avatar_url OR DELETE
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_profile();

REVOKE ALL ON public.editor_applications FROM anon;
REVOKE ALL ON public.payment_transactions FROM anon;
REVOKE ALL ON public.regulation_chunks FROM anon;
REVOKE ALL ON public.roadmap_progress FROM anon;
REVOKE ALL ON public.user_subscriptions FROM anon;

CREATE INDEX IF NOT EXISTS assessments_user_id_idx
  ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS editor_applications_reviewed_by_idx
  ON public.editor_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS payment_transactions_plan_id_idx
  ON public.payment_transactions(plan_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_id_idx
  ON public.user_subscriptions(plan_id);

DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;
CREATE POLICY "Users can view their own assessments"
  ON public.assessments FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.assessments;
CREATE POLICY "Users can insert their own assessments"
  ON public.assessments FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own assessments" ON public.assessments;
CREATE POLICY "Users can update their own assessments"
  ON public.assessments FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can read own editor applications" ON public.editor_applications;
CREATE POLICY "Users can read own editor applications"
  ON public.editor_applications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMIT;

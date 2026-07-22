-- ============================================================
-- Migration: Admin Setup + Secure Admin RPC + RLS (Idempotent)
-- ============================================================

-- 1. Helper function to check if a user is admin (runs as security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND account_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update handle_new_user trigger to assign admin role automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'teukuvaickal@export-ready-ai.vercel.app' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    account_type = CASE 
      WHEN NEW.email = 'teukuvaickal@export-ready-ai.vercel.app' THEN 'admin'
      ELSE public.profiles.account_type
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update existing user's profile to admin if email matches
UPDATE public.profiles
SET account_type = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'teukuvaickal@export-ready-ai.vercel.app'
);

-- 4. RLS policies for Profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. RLS policies for Blog Posts
DROP POLICY IF EXISTS "Admins can update any blog post" ON public.blog_posts;
CREATE POLICY "Admins can update any blog post"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete any blog post" ON public.blog_posts;
CREATE POLICY "Admins can delete any blog post"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 6. RLS policies for Payment Transactions
DROP POLICY IF EXISTS "Admins can read all payments" ON public.payment_transactions;
CREATE POLICY "Admins can read all payments"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 7. Cleanup the public view if it exists (for safety)
DROP VIEW IF EXISTS public.admin_users_view;

-- 8. Secure RPC for Admin Dashboard to fetch user data (including email)
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  avatar_url text,
  phone_number text,
  account_type text,
  created_at timestamptz,
  email text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Security check: only allow admins to execute
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.phone_number,
    p.account_type,
    p.created_at,
    u.email
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_for_admin() TO authenticated;

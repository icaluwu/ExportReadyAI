BEGIN;

CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = p_user_id
        AND account_type = ANY (p_roles)
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = user_id AND account_type = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.user_has_role(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text[]) TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read any profile" ON public.profiles;
CREATE POLICY "Users read own profile or admins read all"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.user_has_role((SELECT auth.uid()), ARRAY['admin'])
  );

DROP POLICY IF EXISTS "Users can read own editor applications" ON public.editor_applications;
DROP POLICY IF EXISTS "Admins can read editor applications" ON public.editor_applications;
CREATE POLICY "Users read own applications or admins read all"
  ON public.editor_applications FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.user_has_role((SELECT auth.uid()), ARRAY['admin'])
  );

DROP POLICY IF EXISTS "Published blog posts are publicly readable" ON public.blog_posts;
CREATE POLICY "Published blog posts are publicly readable"
  ON public.blog_posts FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "Editors can read own posts" ON public.blog_posts;
CREATE POLICY "Authenticated readers and authors can read allowed posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR (
      author_id = (SELECT auth.uid())
      AND public.user_has_role((SELECT auth.uid()), ARRAY['editor', 'admin'])
    )
  );

DROP POLICY IF EXISTS "Editors can update own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update any blog post" ON public.blog_posts;
CREATE POLICY "Editors update own posts or admins update all"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (
    public.user_has_role((SELECT auth.uid()), ARRAY['admin'])
    OR (
      author_id = (SELECT auth.uid())
      AND public.user_has_role((SELECT auth.uid()), ARRAY['editor'])
    )
  )
  WITH CHECK (
    public.user_has_role((SELECT auth.uid()), ARRAY['admin'])
    OR (
      author_id = (SELECT auth.uid())
      AND public.user_has_role((SELECT auth.uid()), ARRAY['editor'])
    )
  );

DROP POLICY IF EXISTS "Editors can delete own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete any blog post" ON public.blog_posts;
CREATE POLICY "Editors delete own posts or admins delete all"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (
    public.user_has_role((SELECT auth.uid()), ARRAY['admin'])
    OR (
      author_id = (SELECT auth.uid())
      AND public.user_has_role((SELECT auth.uid()), ARRAY['editor'])
    )
  );

DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can read own subscriptions"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can read own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can read all payments" ON public.payment_transactions;
CREATE POLICY "Users read own payments or admins read all"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.user_has_role((SELECT auth.uid()), ARRAY['admin'])
  );

REVOKE ALL ON public.regulation_chunks FROM anon, authenticated;

COMMIT;

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS reading_minutes integer NOT NULL DEFAULT 1
  CHECK (reading_minutes > 0);

CREATE OR REPLACE FUNCTION increment_post_view(post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id
    AND status = 'published';
$$;

REVOKE ALL ON FUNCTION increment_post_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_post_view(uuid) TO anon, authenticated;

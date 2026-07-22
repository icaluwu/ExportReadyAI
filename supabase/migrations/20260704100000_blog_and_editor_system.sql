-- ============================================================
-- Migration: Blog System + Editor Role + User Profiles
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES (all users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE,
  full_name     text,
  bio           text,
  avatar_url    text,
  phone_number  text,
  phone_verified boolean NOT NULL DEFAULT false,
  account_type  text NOT NULL DEFAULT 'user'
                  CHECK (account_type IN ('user', 'editor', 'admin')),
  -- Social media links
  social_instagram  text,
  social_twitter    text,
  social_linkedin   text,
  social_github     text,
  social_website    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_account_type_idx ON profiles(account_type);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at trigger for profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- 2. EDITOR APPLICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS editor_applications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  disclaimer_accepted boolean NOT NULL DEFAULT false,
  disclaimer_accepted_at timestamptz,
  phone_number        text,
  phone_verified      boolean NOT NULL DEFAULT false,
  rejection_reason    text,
  reviewed_by         uuid REFERENCES auth.users(id),
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX editor_applications_user_id_idx ON editor_applications(user_id);
CREATE INDEX editor_applications_status_idx ON editor_applications(status);

CREATE TRIGGER editor_applications_updated_at
  BEFORE UPDATE ON editor_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- 3. BLOG CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  color       text DEFAULT '#10b981',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
  ('Regulasi Ekspor', 'regulasi-ekspor', 'Peraturan dan kebijakan ekspor Indonesia', '#3b82f6'),
  ('Tips & Strategi', 'tips-strategi', 'Panduan praktis untuk eksportir UMKM', '#10b981'),
  ('Pasar Global', 'pasar-global', 'Insight pasar internasional untuk produk Indonesia', '#f59e0b'),
  ('Sertifikasi', 'sertifikasi', 'Panduan sertifikasi untuk ekspor', '#8b5cf6'),
  ('Kisah Sukses', 'kisah-sukses', 'Cerita inspiratif eksportir UMKM Indonesia', '#ec4899')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────
-- 4. BLOG POSTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id      uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  excerpt          text,
  content          text NOT NULL DEFAULT '',
  -- SEO fields
  meta_title       text,
  meta_description text,
  og_image_url     text,
  -- Status
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'archived')),
  published_at     timestamptz,
  -- Stats
  view_count       integer NOT NULL DEFAULT 0,
  -- Timestamps
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_author_id_idx ON blog_posts(author_id);
CREATE INDEX blog_posts_slug_idx ON blog_posts(slug);
CREATE INDEX blog_posts_status_published_idx ON blog_posts(status, published_at DESC);
CREATE INDEX blog_posts_category_id_idx ON blog_posts(category_id);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set published_at when status changes to published
CREATE OR REPLACE FUNCTION handle_blog_post_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = COALESCE(NEW.published_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_auto_publish_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION handle_blog_post_publish();

-- ─────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, only update their own
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Editor applications: users can read/insert their own
CREATE POLICY "Users can read own editor applications"
  ON editor_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create editor applications"
  ON editor_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own editor applications"
  ON editor_applications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Blog categories: publicly readable
CREATE POLICY "Blog categories are publicly readable"
  ON blog_categories FOR SELECT USING (true);

-- Blog posts: published posts are public; editors can manage their own
CREATE POLICY "Published blog posts are publicly readable"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Editors can read own posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Editors can create posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Editors can update own posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Editors can delete own posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ─────────────────────────────────────────
-- 6. GRANTS
-- ─────────────────────────────────────────
GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON editor_applications TO authenticated;
GRANT SELECT ON blog_categories TO anon, authenticated;
GRANT SELECT ON blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON blog_posts TO authenticated;

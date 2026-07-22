-- ============================================================
-- Migration: Assessments, Roadmap Progress, and Public Sharing
-- ============================================================

-- ─────────────────────────────────────────
-- 1. ASSESSMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name                  text NOT NULL,
  category                      text NOT NULL,
  description                   text,
  hs_code                       text,
  capacity                      integer,
  capacity_unit                 text,
  price                         integer,
  has_online_presence           boolean,
  export_experience             text,
  certifications                text[] DEFAULT '{}'::text[],
  meets_international_standards text,
  has_trademark                 boolean,
  target_markets                text[] DEFAULT '{}'::text[],
  export_motivation             text,
  email                         text,
  readiness_score               integer NOT NULL,
  score_breakdown               jsonb NOT NULL,
  ai_result                     jsonb NOT NULL,
  status                        text NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'completed', 'failed')),
  user_id                       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token                   uuid UNIQUE,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessments_user_id_idx ON assessments(user_id);
CREATE INDEX IF NOT EXISTS assessments_share_token_idx ON assessments(share_token);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Policies for assessments
CREATE POLICY "Users can read own assessments" ON assessments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Guests can read guest assessments" ON assessments
  FOR SELECT TO anon USING (user_id IS NULL);

CREATE POLICY "Users can insert own assessments" ON assessments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Guests can insert guest assessments" ON assessments
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can update own assessments" ON assessments
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- 2. ROADMAP PROGRESS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase          text NOT NULL,
  item_index     integer NOT NULL,
  done           boolean NOT NULL DEFAULT false,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roadmap_progress_unique_item UNIQUE (assessment_id, phase, item_index)
);

CREATE INDEX IF NOT EXISTS roadmap_progress_assessment_id_idx ON roadmap_progress(assessment_id);
CREATE INDEX IF NOT EXISTS roadmap_progress_user_id_idx ON roadmap_progress(user_id);

-- Enable RLS
ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;

-- Policies for roadmap_progress
CREATE POLICY "Users can view own roadmap progress" ON roadmap_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own roadmap progress" ON roadmap_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER roadmap_progress_updated_at
  BEFORE UPDATE ON roadmap_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- 3. PUBLIC SHARING RPC (ignoring sensitive columns)
-- ─────────────────────────────────────────
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
  WHERE share_token = token;
$$;

-- Grant access to public/anon for the RPC
GRANT EXECUTE ON FUNCTION get_shared_assessment(uuid) TO anon, authenticated;

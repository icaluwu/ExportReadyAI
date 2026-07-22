-- Enable pgvector for regulation similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Subscription plans
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price_idr integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  midtrans_order_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX user_subscriptions_status_idx ON user_subscriptions(status);

-- Payment transactions
CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  order_id text NOT NULL UNIQUE,
  gross_amount integer NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'settlement', 'expire', 'cancel', 'deny')),
  midtrans_transaction_id text,
  payment_type text,
  raw_notification jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payment_transactions_user_id_idx ON payment_transactions(user_id);
CREATE INDEX payment_transactions_order_id_idx ON payment_transactions(order_id);

-- updated_at trigger for payment_transactions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Regulation chunks for RAG
CREATE TABLE regulation_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_title text NOT NULL,
  source_url text,
  chunk_text text NOT NULL,
  chunk_index integer NOT NULL,
  embedding vector(768) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX regulation_chunks_embedding_idx
  ON regulation_chunks USING hnsw (embedding vector_cosine_ops);

-- Similarity search RPC (service role only)
CREATE OR REPLACE FUNCTION match_regulation_chunks(
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source_title text,
  source_url text,
  chunk_text text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    rc.id,
    rc.source_title,
    rc.source_url,
    rc.chunk_text,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM regulation_chunks rc
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Seed subscription plans
INSERT INTO subscription_plans (name, price_idr, features, is_active) VALUES
  ('free', 0, '["assessment_basic"]'::jsonb, true),
  ('premium_monthly', 40000, '["roadmap_full","export_pdf","market_recommendations"]'::jsonb, true),
  ('premium_yearly', 399000, '["roadmap_full","export_pdf","market_recommendations"]'::jsonb, true);

-- Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_chunks ENABLE ROW LEVEL SECURITY;

-- subscription_plans: public read for active plans
CREATE POLICY "Anyone can read active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- user_subscriptions: users read own rows only
CREATE POLICY "Users can read own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- payment_transactions: users read own rows only
CREATE POLICY "Users can read own payments"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Grant Data API access for client reads
GRANT SELECT ON subscription_plans TO anon, authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT SELECT ON payment_transactions TO authenticated;

-- regulation_chunks: no client policies (service role only)

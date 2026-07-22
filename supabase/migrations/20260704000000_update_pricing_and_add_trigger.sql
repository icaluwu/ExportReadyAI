-- Update pricing for plans
UPDATE subscription_plans
SET price_idr = 40000
WHERE name = 'premium_monthly';

UPDATE subscription_plans
SET price_idr = 399000
WHERE name = 'premium_yearly';

-- Create function to activate subscription on settlement
CREATE OR REPLACE FUNCTION activate_subscription_on_settlement()
RETURNS TRIGGER AS $$
DECLARE
  plan_name text;
  duration_days integer;
  expires_at_val timestamptz;
  existing_sub_id uuid;
  existing_expires_at timestamptz;
BEGIN
  IF NEW.status = 'settlement' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'settlement') THEN
    -- Get plan name
    SELECT name INTO plan_name FROM subscription_plans WHERE id = NEW.plan_id;
    
    -- Determine duration
    IF plan_name = 'premium_yearly' THEN
      duration_days := 365;
    ELSE
      duration_days := 30;
    END IF;
    
    -- Check if user already has an active subscription
    SELECT id, expires_at INTO existing_sub_id, existing_expires_at
    FROM user_subscriptions
    WHERE user_id = NEW.user_id AND status = 'active'
    LIMIT 1;
    
    IF existing_sub_id IS NOT NULL THEN
      -- Extend subscription
      IF existing_expires_at > now() THEN
        expires_at_val := existing_expires_at + (duration_days || ' days')::interval;
      ELSE
        expires_at_val := now() + (duration_days || ' days')::interval;
      END IF;
      
      UPDATE user_subscriptions
      SET plan_id = NEW.plan_id,
          status = 'active',
          expires_at = expires_at_val,
          updated_at = now(),
          midtrans_order_id = NEW.order_id
      WHERE id = existing_sub_id;
    ELSE
      -- Insert new subscription
      expires_at_val := now() + (duration_days || ' days')::interval;
      
      INSERT INTO user_subscriptions (user_id, plan_id, status, started_at, expires_at, midtrans_order_id)
      VALUES (NEW.user_id, NEW.plan_id, 'active', now(), expires_at_val, NEW.order_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on payment_transactions
DROP TRIGGER IF EXISTS tr_payment_transactions_settlement ON payment_transactions;
CREATE TRIGGER tr_payment_transactions_settlement
  AFTER INSERT OR UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION activate_subscription_on_settlement();

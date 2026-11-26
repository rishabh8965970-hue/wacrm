-- ============================================================
-- 060_billing_subscriptions.sql — SaaS subscriptions & Razorpay payments
--
-- Adds per-account workspace subscriptions (7-day free trial, Starter,
-- Growth ₹999/mo, Business ₹2,499/mo) and a Razorpay payment ledger.
-- Meta WhatsApp per-message charges continue to be billed directly by
-- Meta to each workspace's own connected Meta Business Manager card.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES public.accounts(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan_id IN ('trial', 'starter', 'growth', 'business')),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('trial', 'starter', 'growth', 'business')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_account_created
  ON public.billing_payments(account_id, created_at DESC);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_updated_at ON public.billing_subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Read-only access for workspace members; all mutations go through server-side
-- service_role routes after Razorpay signature verification or Super Admin checks.
DROP POLICY IF EXISTS "Members can view account subscription" ON public.billing_subscriptions;
CREATE POLICY "Members can view account subscription"
  ON public.billing_subscriptions FOR SELECT
  USING (public.is_account_member(account_id, 'viewer'));

DROP POLICY IF EXISTS "Members can view account payments" ON public.billing_payments;
CREATE POLICY "Members can view account payments"
  ON public.billing_payments FOR SELECT
  USING (public.is_account_member(account_id, 'viewer'));

-- Seed a 7-day trial row automatically whenever a new workspace account is created.
CREATE OR REPLACE FUNCTION public.handle_new_account_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.billing_subscriptions (account_id, plan_id, status, trial_ends_at)
  VALUES (NEW.id, 'trial', 'trialing', NOW() + INTERVAL '7 days')
  ON CONFLICT (account_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_account_created_seed_subscription ON public.accounts;
CREATE TRIGGER on_account_created_seed_subscription
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_account_subscription();

-- Backfill any existing accounts that predate this migration.
INSERT INTO public.billing_subscriptions (account_id, plan_id, status, trial_ends_at)
SELECT id, 'trial', 'trialing', NOW() + INTERVAL '7 days'
FROM public.accounts
ON CONFLICT (account_id) DO NOTHING;

GRANT ALL ON TABLE public.billing_subscriptions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.billing_payments TO anon, authenticated, service_role;

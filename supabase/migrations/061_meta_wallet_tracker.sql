-- ============================================================
-- 061_meta_wallet_tracker.sql — Per-account Meta prepaid wallet estimate
--
-- Tracks user-entered Meta prepaid balance / recharges so the CRM can
-- subtract live Meta pricing_analytics spend and show an estimated
-- remaining Meta wallet balance (since Meta Graph API does not expose
-- exact Billing Hub Available funds directly).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meta_wallet_trackers (
  account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  waba_id TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  funded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (funded_amount >= 0),
  spend_offset NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (spend_offset >= 0),
  tracking_since DATE NOT NULL DEFAULT CURRENT_DATE,
  low_balance_threshold NUMERIC(10, 2) NOT NULL DEFAULT 100 CHECK (low_balance_threshold >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.meta_wallet_trackers ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_updated_at ON public.meta_wallet_trackers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.meta_wallet_trackers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS "Members can view account meta wallet tracker" ON public.meta_wallet_trackers;
CREATE POLICY "Members can view account meta wallet tracker"
  ON public.meta_wallet_trackers FOR SELECT
  USING (public.is_account_member(account_id, 'viewer'));

GRANT ALL ON TABLE public.meta_wallet_trackers TO anon, authenticated, service_role;

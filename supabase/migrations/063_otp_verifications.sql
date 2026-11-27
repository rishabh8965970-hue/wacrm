-- ============================================================
-- 063_otp_verifications.sql — WhatsApp OTP API ledger
--
-- Stores hashed one-time passcodes issued via POST /api/v1/otp/send
-- and verified via POST /api/v1/otp/verify. Plaintext OTP codes are
-- never persisted.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  phone_normalized TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  code_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  code_length INTEGER NOT NULL DEFAULT 6 CHECK (code_length IN (4, 6, 8)),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  template_name TEXT NOT NULL,
  whatsapp_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'expired', 'failed', 'superseded')),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_lookup
  ON public.otp_verifications(account_id, phone_normalized, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_account_created
  ON public.otp_verifications(account_id, created_at DESC);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view account otp logs" ON public.otp_verifications;
CREATE POLICY "Members can view account otp logs"
  ON public.otp_verifications FOR SELECT
  USING (public.is_account_member(account_id, 'viewer'));

GRANT ALL ON TABLE public.otp_verifications TO anon, authenticated, service_role;

-- ============================================================
-- 062_ad_leads_and_date_filter.sql — Click-to-WhatsApp Ad attribution
-- and date-range contact filtering
-- ============================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS ad_source_id TEXT,
  ADD COLUMN IF NOT EXISTS ad_headline TEXT,
  ADD COLUMN IF NOT EXISTS ad_source_url TEXT,
  ADD COLUMN IF NOT EXISTS last_inbound_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contacts_account_created
  ON public.contacts(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_account_lead_source
  ON public.contacts(account_id, lead_source)
  WHERE lead_source IS NOT NULL;

DROP FUNCTION IF EXISTS public.filter_contacts_by_tags(UUID[], TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.filter_contacts_by_tags(
  p_tag_ids UUID[],
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 25,
  p_offset INT DEFAULT 0,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL,
  p_lead_source TEXT DEFAULT NULL
)
RETURNS TABLE (contact contacts, total_count BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH matched AS (
    SELECT DISTINCT c.id, c.created_at
    FROM contacts c
    JOIN contact_tags ct ON ct.contact_id = c.id
    WHERE ct.tag_id = ANY(p_tag_ids)
      AND (
        p_search IS NULL
        OR c.name ILIKE '%' || p_search || '%'
        OR c.phone ILIKE '%' || p_search || '%'
        OR c.email ILIKE '%' || p_search || '%'
      )
      AND (p_from IS NULL OR c.created_at >= p_from)
      AND (p_to IS NULL OR c.created_at < p_to)
      AND (p_lead_source IS NULL OR c.lead_source = p_lead_source)
  ),
  page AS (
    SELECT id, count(*) OVER() AS total_count
    FROM matched
    ORDER BY created_at DESC, id
    LIMIT p_limit OFFSET p_offset
  )
  SELECT c AS contact, page.total_count
  FROM page
  JOIN contacts c ON c.id = page.id
  ORDER BY c.created_at DESC, c.id;
$$;

ALTER FUNCTION public.filter_contacts_by_tags(UUID[], TEXT, INT, INT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.filter_contacts_by_tags(UUID[], TEXT, INT, INT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.filter_contacts_by_tags(UUID[], TEXT, INT, INT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;

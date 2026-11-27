import { requireApiKey } from '@/lib/auth/api-context';
import { hasScope } from '@/lib/api-keys/scopes';
import { isUuid } from '@/lib/api/v1/pagination';
import { fail, ok, toApiErrorResponse } from '@/lib/api/v1/respond';
import { checkAccountPlanFeature } from '@/lib/billing/server';
import { normalizeKey } from '@/lib/contacts/dedupe';
import { normalizeOtpPurpose, verifyOtpHash } from '@/lib/whatsapp/otp';
import { parseInternationalPhone } from '@/lib/whatsapp/phone-utils';

interface OtpRow {
  id: string;
  phone: string;
  phone_normalized: string;
  purpose: string;
  code_hash: string;
  salt: string;
  attempts: number;
  max_attempts: number;
  status: string;
  expires_at: string;
}

async function resolveOwnerEmail(
  supabase: Awaited<ReturnType<typeof requireApiKey>>['supabase'],
  accountId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('account_id', accountId)
    .eq('account_role', 'owner')
    .limit(1)
    .maybeSingle();
  return (data as { email?: string | null } | null)?.email ?? null;
}

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request);

    if (!hasScope(ctx.scopes, 'otp:send') && !hasScope(ctx.scopes, 'messages:send')) {
      return fail(
        'forbidden',
        "This API key requires the 'otp:send' or 'messages:send' scope.",
        403,
      );
    }

    const ownerEmail = await resolveOwnerEmail(ctx.supabase, ctx.accountId);
    const planCheck = await checkAccountPlanFeature(ctx.accountId, 'api', ownerEmail);
    if (!planCheck.allowed) {
      return fail(
        'forbidden',
        'OTP API requires the Business plan (or active 7-day trial). Upgrade in Settings → Billing.',
        402,
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const rawCode =
      typeof body.otp === 'string'
        ? body.otp.trim()
        : typeof body.code === 'string'
          ? body.code.trim()
          : '';
    if (!/^\d{4,8}$/.test(rawCode)) {
      return fail('bad_request', "Provide a 4 to 8 digit 'otp' code.", 400);
    }

    const otpId = typeof body.otp_id === 'string' ? body.otp_id.trim() : '';
    const rawPhone =
      typeof body.phone === 'string'
        ? body.phone
        : typeof body.to === 'string'
          ? body.to
          : '';
    const purpose = normalizeOtpPurpose(body.purpose);

    let query = ctx.supabase
      .from('otp_verifications')
      .select('id, phone, phone_normalized, purpose, code_hash, salt, attempts, max_attempts, status, expires_at')
      .eq('account_id', ctx.accountId)
      .eq('status', 'pending');

    if (otpId) {
      if (!isUuid(otpId)) {
        return fail('bad_request', 'Invalid otp_id format.', 400);
      }
      query = query.eq('id', otpId);
    } else {
      const e164Digits = parseInternationalPhone(rawPhone);
      if (!e164Digits) {
        return fail(
          'bad_request',
          "Provide either 'otp_id' or 'phone' in international E.164 format (+91...).",
          400,
        );
      }
      const phoneNormalized = normalizeKey(`+${e164Digits}`);
      query = query
        .eq('phone_normalized', phoneNormalized)
        .eq('purpose', purpose)
        .order('created_at', { ascending: false });
    }

    const { data: rows, error: fetchError } = await query.limit(1);
    if (fetchError) {
      return fail('internal', 'Failed to look up OTP verification', 500);
    }

    const row = (rows?.[0] as OtpRow | undefined) ?? null;
    if (!row) {
      return fail('not_found', 'No active pending OTP found. Request a new code.', 404);
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await ctx.supabase
        .from('otp_verifications')
        .update({ status: 'expired' })
        .eq('id', row.id);
      return fail('bad_request', 'OTP has expired. Request a new code.', 400);
    }

    if (row.attempts >= row.max_attempts) {
      await ctx.supabase
        .from('otp_verifications')
        .update({ status: 'failed' })
        .eq('id', row.id);
      return fail('rate_limited', 'Maximum OTP attempts exceeded. Request a new code.', 429);
    }

    const matched = verifyOtpHash({
      code: rawCode,
      salt: row.salt,
      expectedHash: row.code_hash,
    });

    if (!matched) {
      const nextAttempts = row.attempts + 1;
      const exhausted = nextAttempts >= row.max_attempts;
      await ctx.supabase
        .from('otp_verifications')
        .update({
          attempts: nextAttempts,
          ...(exhausted ? { status: 'failed' } : {}),
        })
        .eq('id', row.id);

      const remaining = Math.max(0, row.max_attempts - nextAttempts);
      return fail(
        'bad_request',
        remaining > 0
          ? `Invalid OTP code (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).`
          : 'Invalid OTP code. Maximum attempts exceeded — request a new code.',
        400,
      );
    }

    const verifiedAt = new Date().toISOString();
    await ctx.supabase
      .from('otp_verifications')
      .update({
        status: 'verified',
        verified_at: verifiedAt,
      })
      .eq('id', row.id);

    return ok({
      verified: true,
      otp_id: row.id,
      phone: row.phone,
      purpose: row.purpose,
      verified_at: verifiedAt,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

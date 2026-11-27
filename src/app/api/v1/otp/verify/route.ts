import { requireApiKey } from '@/lib/auth/api-context';
import { hasScope } from '@/lib/api-keys/scopes';
import { fail, ok, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  assertOtpPlanAllowed,
  OtpServiceError,
  verifyStoredOtp,
} from '@/lib/whatsapp/otp-service';

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

    await assertOtpPlanAllowed(ctx.supabase, ctx.accountId);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const rawCode =
      typeof body.otp === 'string'
        ? body.otp
        : typeof body.code === 'string'
          ? body.code
          : '';
    const rawPhone =
      typeof body.phone === 'string'
        ? body.phone
        : typeof body.to === 'string'
          ? body.to
          : '';

    const result = await verifyStoredOtp(ctx.supabase, {
      accountId: ctx.accountId,
      rawCode,
      otpId: typeof body.otp_id === 'string' ? body.otp_id : undefined,
      rawPhone,
      purpose: body.purpose,
    });

    return ok(result);
  } catch (err) {
    if (err instanceof OtpServiceError) {
      return fail(err.code, err.message, err.status);
    }
    return toApiErrorResponse(err);
  }
}

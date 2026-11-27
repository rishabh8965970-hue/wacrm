import { requireApiKey } from '@/lib/auth/api-context';
import { hasScope } from '@/lib/api-keys/scopes';
import { fail, ok, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  assertOtpPlanAllowed,
  issueAndSendOtp,
  OtpServiceError,
  parseOtpDeliveryMode,
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

    const rawPhone =
      typeof body.phone === 'string'
        ? body.phone
        : typeof body.to === 'string'
          ? body.to
          : '';

    const result = await issueAndSendOtp(ctx.supabase, {
      accountId: ctx.accountId,
      apiKeyId: ctx.keyId,
      rawPhone,
      purpose: body.purpose,
      length: body.length,
      expiryMinutes: body.expiry_minutes,
      templateName: body.template_name,
      templateLanguage: body.template_language,
      contactName: body.name,
      deliveryMode: parseOtpDeliveryMode(body.delivery_mode, body.allow_session_fallback),
    });

    return ok(result, 201);
  } catch (err) {
    if (err instanceof OtpServiceError) {
      return fail(err.code, err.message, err.status);
    }
    return toApiErrorResponse(err);
  }
}

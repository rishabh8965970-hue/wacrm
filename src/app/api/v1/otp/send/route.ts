import { requireApiKey } from '@/lib/auth/api-context';
import { hasScope } from '@/lib/api-keys/scopes';
import { fail, ok, toApiErrorResponse } from '@/lib/api/v1/respond';
import { checkAccountPlanFeature } from '@/lib/billing/server';
import { normalizeKey } from '@/lib/contacts/dedupe';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import {
  buildOtpTemplateParams,
  DEFAULT_OTP_MAX_ATTEMPTS,
  generateOtpCode,
  generateOtpSalt,
  hashOtpCode,
  normalizeOtpPurpose,
  parseOtpExpiryMinutes,
  parseOtpLength,
} from '@/lib/whatsapp/otp';
import { parseInternationalPhone } from '@/lib/whatsapp/phone-utils';
import { resolveConversationByPhone } from '@/lib/whatsapp/resolve-conversation';
import { SendMessageError, sendMessageToConversation } from '@/lib/whatsapp/send-message';
import type { MessageTemplate } from '@/types';

async function resolveOwnerEmail(
  supabase: Parameters<typeof resolveConversationByPhone>[0],
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

    const rawPhone =
      typeof body.phone === 'string'
        ? body.phone
        : typeof body.to === 'string'
          ? body.to
          : '';
    const e164Digits = parseInternationalPhone(rawPhone);
    if (!e164Digits) {
      return fail(
        'bad_request',
        "Provide 'phone' in international E.164 format with '+', e.g. +919876543210",
        400,
      );
    }

    const toWithPlus = `+${e164Digits}`;
    const phoneNormalized = normalizeKey(toWithPlus);
    const purpose = normalizeOtpPurpose(body.purpose);
    const length = parseOtpLength(body.length);
    const expiryMinutes = parseOtpExpiryMinutes(body.expiry_minutes);
    const requestedTemplate =
      typeof body.template_name === 'string' ? body.template_name.trim() : '';
    const requestedLanguage =
      typeof body.template_language === 'string' && body.template_language.trim()
        ? body.template_language.trim()
        : null;
    const contactName =
      typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;

    const phoneLimit = checkRateLimit(
      `otp-phone:${ctx.accountId}:${phoneNormalized}`,
      RATE_LIMITS.otpPerPhone,
    );
    if (!phoneLimit.success) {
      const retrySec = Math.max(1, Math.ceil((phoneLimit.reset - Date.now()) / 1000));
      return fail(
        'rate_limited',
        `Too many OTP requests for this phone. Try again in ${retrySec}s.`,
        429,
      );
    }

    // Resolve approved template: either caller-specified or latest APPROVED AUTHENTICATION template
    let templateQuery = ctx.supabase
      .from('message_templates')
      .select('*')
      .eq('account_id', ctx.accountId)
      .eq('status', 'APPROVED');

    if (requestedTemplate) {
      templateQuery = templateQuery.eq('name', requestedTemplate);
      if (requestedLanguage) {
        templateQuery = templateQuery.eq('language', requestedLanguage);
      }
    } else {
      templateQuery = templateQuery
        .eq('category', 'AUTHENTICATION')
        .order('updated_at', { ascending: false });
    }

    const { data: templateRows, error: tplError } = await templateQuery.limit(1);
    if (tplError) {
      return fail('internal', 'Failed to query WhatsApp templates', 500);
    }

    const templateRow = (templateRows?.[0] as MessageTemplate | undefined) ?? null;
    if (!templateRow) {
      return fail(
        'bad_request',
        requestedTemplate
          ? `Approved template "${requestedTemplate}" not found. Sync your Meta templates in Settings → Templates.`
          : 'No approved AUTHENTICATION template found. Create one in Meta Business, sync in Settings → Templates, or pass template_name.',
        400,
      );
    }

    const otpCode = generateOtpCode(length);
    const salt = generateOtpSalt();
    const codeHash = hashOtpCode(otpCode, salt);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000).toISOString();

    await ctx.supabase
      .from('otp_verifications')
      .update({ status: 'superseded' })
      .eq('account_id', ctx.accountId)
      .eq('phone_normalized', phoneNormalized)
      .eq('purpose', purpose)
      .eq('status', 'pending');

    const { data: otpRow, error: insertError } = await ctx.supabase
      .from('otp_verifications')
      .insert({
        account_id: ctx.accountId,
        api_key_id: ctx.keyId,
        phone: toWithPlus,
        phone_normalized: phoneNormalized,
        purpose,
        code_hash: codeHash,
        salt,
        code_length: length,
        max_attempts: DEFAULT_OTP_MAX_ATTEMPTS,
        template_name: templateRow.name,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError || !otpRow) {
      return fail('internal', 'Could not create OTP verification record', 500);
    }

    const otpId = (otpRow as { id: string }).id;

    try {
      const resolved = await resolveConversationByPhone(
        ctx.supabase,
        ctx.accountId,
        toWithPlus,
        contactName,
      );

      const messageParams = buildOtpTemplateParams(templateRow, otpCode, expiryMinutes);
      const sendResult = await sendMessageToConversation(ctx.supabase, ctx.accountId, {
        conversationId: resolved.conversationId,
        messageType: 'template',
        templateName: templateRow.name,
        templateLanguage: requestedLanguage ?? templateRow.language ?? 'en_US',
        templateMessageParams: messageParams,
      });

      await ctx.supabase
        .from('otp_verifications')
        .update({ whatsapp_message_id: sendResult.whatsappMessageId })
        .eq('id', otpId);

      return ok(
        {
          otp_id: otpId,
          whatsapp_message_id: sendResult.whatsappMessageId,
          to: toWithPlus,
          purpose,
          template_name: templateRow.name,
          length,
          expires_at: expiresAt,
          expires_in_seconds: expiryMinutes * 60,
        },
        201,
      );
    } catch (sendErr) {
      await ctx.supabase
        .from('otp_verifications')
        .update({ status: 'failed' })
        .eq('id', otpId);

      if (sendErr instanceof SendMessageError) {
        return fail(sendErr.code, sendErr.message, sendErr.status);
      }
      throw sendErr;
    }
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

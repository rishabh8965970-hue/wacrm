import type { SupabaseClient } from '@supabase/supabase-js';
import { checkAccountPlanFeature } from '@/lib/billing/server';
import { isUuid } from '@/lib/api/v1/pagination';
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
  verifyOtpHash,
} from '@/lib/whatsapp/otp';
import { parseInternationalPhone } from '@/lib/whatsapp/phone-utils';
import { resolveConversationByPhone } from '@/lib/whatsapp/resolve-conversation';
import { SendMessageError, sendMessageToConversation } from '@/lib/whatsapp/send-message';
import type { MessageTemplate } from '@/types';

export type OtpDeliveryMode = 'template' | 'session_text' | 'auto';

export class OtpServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'OtpServiceError';
    this.code = code;
    this.status = status;
  }
}

export function parseOtpDeliveryMode(raw: unknown, allowFallback?: unknown): OtpDeliveryMode {
  if (raw === 'session_text') return 'session_text';
  if (raw === 'auto' || allowFallback === true) return 'auto';
  return 'template';
}

export async function resolveAccountOwnerEmail(
  supabase: SupabaseClient,
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

export async function assertOtpPlanAllowed(
  supabase: SupabaseClient,
  accountId: string,
): Promise<void> {
  const ownerEmail = await resolveAccountOwnerEmail(supabase, accountId);
  const planCheck = await checkAccountPlanFeature(accountId, 'api', ownerEmail);
  if (!planCheck.allowed) {
    throw new OtpServiceError(
      'forbidden',
      'OTP API requires the Business plan (or active 7-day trial). Upgrade in Settings → Billing.',
      402,
    );
  }
}

export interface IssueOtpInput {
  accountId: string;
  apiKeyId?: string | null;
  rawPhone: string;
  purpose?: unknown;
  length?: unknown;
  expiryMinutes?: unknown;
  templateName?: unknown;
  templateLanguage?: unknown;
  contactName?: unknown;
  deliveryMode?: OtpDeliveryMode;
}

export interface IssueOtpResult {
  otp_id: string;
  whatsapp_message_id: string;
  to: string;
  purpose: string;
  delivery_mode: 'template' | 'session_text';
  template_name: string;
  length: number;
  expires_at: string;
  expires_in_seconds: number;
}

export async function issueAndSendOtp(
  supabase: SupabaseClient,
  input: IssueOtpInput,
): Promise<IssueOtpResult> {
  const e164Digits = parseInternationalPhone(input.rawPhone);
  if (!e164Digits) {
    throw new OtpServiceError(
      'bad_request',
      "Provide 'phone' in international E.164 format with '+', e.g. +919876543210",
      400,
    );
  }

  const toWithPlus = `+${e164Digits}`;
  const phoneNormalized = normalizeKey(toWithPlus);
  const purpose = normalizeOtpPurpose(input.purpose);
  const length = parseOtpLength(input.length);
  const expiryMinutes = parseOtpExpiryMinutes(input.expiryMinutes);
  const requestedTemplate =
    typeof input.templateName === 'string' ? input.templateName.trim() : '';
  const requestedLanguage =
    typeof input.templateLanguage === 'string' && input.templateLanguage.trim()
      ? input.templateLanguage.trim()
      : null;
  const contactName =
    typeof input.contactName === 'string' && input.contactName.trim()
      ? input.contactName.trim()
      : null;
  const mode: OtpDeliveryMode = input.deliveryMode ?? 'template';

  const phoneLimit = checkRateLimit(
    `otp-phone:${input.accountId}:${phoneNormalized}`,
    RATE_LIMITS.otpPerPhone,
  );
  if (!phoneLimit.success) {
    const retrySec = Math.max(1, Math.ceil((phoneLimit.reset - Date.now()) / 1000));
    throw new OtpServiceError(
      'rate_limited',
      `Too many OTP requests for this phone. Try again in ${retrySec}s.`,
      429,
    );
  }

  let templateRow: MessageTemplate | null = null;
  if (mode !== 'session_text') {
    let templateQuery = supabase
      .from('message_templates')
      .select('*')
      .eq('account_id', input.accountId)
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
      throw new OtpServiceError('internal', 'Failed to query WhatsApp templates', 500);
    }
    templateRow = (templateRows?.[0] as MessageTemplate | undefined) ?? null;

    if (!templateRow && mode === 'template') {
      throw new OtpServiceError(
        'bad_request',
        requestedTemplate
          ? `Approved template "${requestedTemplate}" not found. Sync your Meta templates in Settings → Templates.`
          : 'No approved AUTHENTICATION template found. Create one in Meta Business, sync in Settings → Templates, or test via 24h Session Text.',
        400,
      );
    }
  }

  const effectiveMode: 'template' | 'session_text' = templateRow ? 'template' : 'session_text';
  const storedTemplateName = templateRow ? templateRow.name : 'session_text';

  const otpCode = generateOtpCode(length);
  const salt = generateOtpSalt();
  const codeHash = hashOtpCode(otpCode, salt);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60_000).toISOString();

  await supabase
    .from('otp_verifications')
    .update({ status: 'superseded' })
    .eq('account_id', input.accountId)
    .eq('phone_normalized', phoneNormalized)
    .eq('purpose', purpose)
    .eq('status', 'pending');

  const { data: otpRow, error: insertError } = await supabase
    .from('otp_verifications')
    .insert({
      account_id: input.accountId,
      api_key_id: input.apiKeyId ?? null,
      phone: toWithPlus,
      phone_normalized: phoneNormalized,
      purpose,
      code_hash: codeHash,
      salt,
      code_length: length,
      max_attempts: DEFAULT_OTP_MAX_ATTEMPTS,
      template_name: storedTemplateName,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (insertError || !otpRow) {
    throw new OtpServiceError('internal', 'Could not create OTP verification record', 500);
  }

  const otpId = (otpRow as { id: string }).id;

  try {
    const resolved = await resolveConversationByPhone(
      supabase,
      input.accountId,
      toWithPlus,
      contactName,
    );

    const sendResult =
      effectiveMode === 'template' && templateRow
        ? await sendMessageToConversation(supabase, input.accountId, {
            conversationId: resolved.conversationId,
            messageType: 'template',
            templateName: templateRow.name,
            templateLanguage: requestedLanguage ?? templateRow.language ?? 'en_US',
            templateMessageParams: buildOtpTemplateParams(templateRow, otpCode, expiryMinutes),
          })
        : await sendMessageToConversation(supabase, input.accountId, {
            conversationId: resolved.conversationId,
            messageType: 'text',
            contentText: `Your verification code is ${otpCode}. Valid for ${expiryMinutes} minute${expiryMinutes === 1 ? '' : 's'}. Do not share this code with anyone.`,
          });

    await supabase
      .from('otp_verifications')
      .update({ whatsapp_message_id: sendResult.whatsappMessageId })
      .eq('id', otpId);

    return {
      otp_id: otpId,
      whatsapp_message_id: sendResult.whatsappMessageId,
      to: toWithPlus,
      purpose,
      delivery_mode: effectiveMode,
      template_name: storedTemplateName,
      length,
      expires_at: expiresAt,
      expires_in_seconds: expiryMinutes * 60,
    };
  } catch (sendErr) {
    await supabase
      .from('otp_verifications')
      .update({ status: 'failed' })
      .eq('id', otpId);

    if (sendErr instanceof SendMessageError) {
      const hint =
        effectiveMode === 'session_text' &&
        /re-engagement|24|131047|window/i.test(sendErr.message)
          ? `${sendErr.message} — First send "Hi" from ${toWithPlus} to your WhatsApp number to open the 24h chat window.`
          : sendErr.message;
      throw new OtpServiceError(sendErr.code, hint, sendErr.status);
    }
    throw sendErr;
  }
}

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

export interface VerifyOtpInput {
  accountId: string;
  rawCode: string;
  otpId?: string;
  rawPhone?: string;
  purpose?: unknown;
}

export interface VerifyOtpResult {
  verified: true;
  otp_id: string;
  phone: string;
  purpose: string;
  verified_at: string;
}

export async function verifyStoredOtp(
  supabase: SupabaseClient,
  input: VerifyOtpInput,
): Promise<VerifyOtpResult> {
  const code = input.rawCode.trim();
  if (!/^\d{4,8}$/.test(code)) {
    throw new OtpServiceError('bad_request', "Provide a 4 to 8 digit 'otp' code.", 400);
  }

  const otpId = (input.otpId ?? '').trim();
  const purpose = normalizeOtpPurpose(input.purpose);

  let query = supabase
    .from('otp_verifications')
    .select(
      'id, phone, phone_normalized, purpose, code_hash, salt, attempts, max_attempts, status, expires_at',
    )
    .eq('account_id', input.accountId)
    .eq('status', 'pending');

  if (otpId) {
    if (!isUuid(otpId)) {
      throw new OtpServiceError('bad_request', 'Invalid otp_id format.', 400);
    }
    query = query.eq('id', otpId);
  } else {
    const e164Digits = parseInternationalPhone(input.rawPhone ?? '');
    if (!e164Digits) {
      throw new OtpServiceError(
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
    throw new OtpServiceError('internal', 'Failed to look up OTP verification', 500);
  }

  const row = (rows?.[0] as OtpRow | undefined) ?? null;
  if (!row) {
    throw new OtpServiceError(
      'not_found',
      'No active pending OTP found. Request a new code.',
      404,
    );
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await supabase.from('otp_verifications').update({ status: 'expired' }).eq('id', row.id);
    throw new OtpServiceError('bad_request', 'OTP has expired. Request a new code.', 400);
  }

  if (row.attempts >= row.max_attempts) {
    await supabase.from('otp_verifications').update({ status: 'failed' }).eq('id', row.id);
    throw new OtpServiceError(
      'rate_limited',
      'Maximum OTP attempts exceeded. Request a new code.',
      429,
    );
  }

  const matched = verifyOtpHash({
    code,
    salt: row.salt,
    expectedHash: row.code_hash,
  });

  if (!matched) {
    const nextAttempts = row.attempts + 1;
    const exhausted = nextAttempts >= row.max_attempts;
    await supabase
      .from('otp_verifications')
      .update({
        attempts: nextAttempts,
        ...(exhausted ? { status: 'failed' } : {}),
      })
      .eq('id', row.id);

    const remaining = Math.max(0, row.max_attempts - nextAttempts);
    throw new OtpServiceError(
      'bad_request',
      remaining > 0
        ? `Invalid OTP code (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).`
        : 'Invalid OTP code. Maximum attempts exceeded — request a new code.',
      400,
    );
  }

  const verifiedAt = new Date().toISOString();
  await supabase
    .from('otp_verifications')
    .update({
      status: 'verified',
      verified_at: verifiedAt,
    })
    .eq('id', row.id);

  return {
    verified: true,
    otp_id: row.id,
    phone: row.phone,
    purpose: row.purpose,
    verified_at: verifiedAt,
  };
  }

import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { MessageTemplate } from '@/types';
import { extractVariableIndices } from './template-validators';
import type { SendTimeParams } from './template-send-builder';

export const ALLOWED_OTP_LENGTHS = [4, 6, 8] as const;
export type OtpLength = (typeof ALLOWED_OTP_LENGTHS)[number];

export const DEFAULT_OTP_LENGTH: OtpLength = 6;
export const DEFAULT_OTP_EXPIRY_MINUTES = 5;
export const MIN_OTP_EXPIRY_MINUTES = 1;
export const MAX_OTP_EXPIRY_MINUTES = 30;
export const DEFAULT_OTP_MAX_ATTEMPTS = 5;

export function parseOtpLength(raw: unknown): OtpLength {
  const n = Number(raw);
  if (n === 4 || n === 6 || n === 8) return n;
  return DEFAULT_OTP_LENGTH;
}

export function parseOtpExpiryMinutes(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < MIN_OTP_EXPIRY_MINUTES) {
    return DEFAULT_OTP_EXPIRY_MINUTES;
  }
  return Math.min(MAX_OTP_EXPIRY_MINUTES, n);
}

export function normalizeOtpPurpose(raw: unknown): string {
  if (typeof raw !== 'string') return 'login';
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 40);
  return cleaned || 'login';
}

export function generateOtpCode(length: OtpLength = DEFAULT_OTP_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += String(randomInt(0, 10));
  }
  return code;
}

export function generateOtpSalt(): string {
  return randomBytes(16).toString('hex');
}

export function hashOtpCode(code: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${code.trim()}`).digest('hex');
}

export function verifyOtpHash(params: {
  code: string;
  salt: string;
  expectedHash: string;
}): boolean {
  const candidateHex = hashOtpCode(params.code, params.salt);
  const a = Buffer.from(candidateHex, 'hex');
  const b = Buffer.from(params.expectedHash, 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Build structured Meta send-time parameters for an OTP / Authentication
 * template: fills body {{1}} (and optional {{2}} expiry minutes) plus any
 * COPY_CODE or dynamic URL button carrying the OTP code.
 */
export function buildOtpTemplateParams(
  template: Pick<MessageTemplate, 'body_text' | 'buttons'>,
  otpCode: string,
  expiryMinutes: number,
): SendTimeParams {
  const bodyIndices = extractVariableIndices(template.body_text ?? '');
  const body: string[] =
    bodyIndices.length === 0
      ? []
      : bodyIndices.map((_, idx) => (idx === 0 ? otpCode : String(expiryMinutes)));

  const buttonParams: Record<number, string> = {};
  if (Array.isArray(template.buttons)) {
    template.buttons.forEach((btn, idx) => {
      if (btn.type === 'COPY_CODE') {
        buttonParams[idx] = otpCode;
      } else if (btn.type === 'URL' && extractVariableIndices(btn.url ?? '').length > 0) {
        buttonParams[idx] = otpCode;
      }
    });
  }

  return {
    ...(body.length > 0 ? { body } : {}),
    ...(Object.keys(buttonParams).length > 0 ? { buttonParams } : {}),
  };
}

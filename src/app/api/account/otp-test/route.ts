import { NextResponse } from 'next/server';
import { requireRole, toErrorResponse } from '@/lib/auth/account';
import { supabaseAdmin } from '@/lib/flows/admin-client';
import {
  assertOtpPlanAllowed,
  issueAndSendOtp,
  OtpServiceError,
  parseOtpDeliveryMode,
  verifyStoredOtp,
} from '@/lib/whatsapp/otp-service';

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('admin');
    const admin = supabaseAdmin();

    await assertOtpPlanAllowed(admin, ctx.accountId);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
    }

    if (body.action === 'verify') {
      const result = await verifyStoredOtp(admin, {
        accountId: ctx.accountId,
        rawCode: typeof body.otp === 'string' ? body.otp : '',
        otpId: typeof body.otp_id === 'string' ? body.otp_id : undefined,
        rawPhone: typeof body.phone === 'string' ? body.phone : '',
        purpose: body.purpose,
      });
      return NextResponse.json(result);
    }

    const result = await issueAndSendOtp(admin, {
      accountId: ctx.accountId,
      apiKeyId: null,
      rawPhone: typeof body.phone === 'string' ? body.phone : '',
      purpose: body.purpose ?? 'test',
      length: body.length,
      expiryMinutes: body.expiry_minutes,
      templateName: body.template_name,
      deliveryMode: parseOtpDeliveryMode(body.delivery_mode, true),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof OtpServiceError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return toErrorResponse(err);
  }
}

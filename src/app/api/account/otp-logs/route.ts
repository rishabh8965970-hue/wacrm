import { NextResponse } from 'next/server';
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account';

export async function GET() {
  try {
    const ctx = await getCurrentAccount();

    const [{ data: logs, error: logsErr }, { data: authTemplates }] = await Promise.all([
      ctx.supabase
        .from('otp_verifications')
        .select(
          'id, phone, purpose, code_length, attempts, max_attempts, template_name, whatsapp_message_id, status, expires_at, verified_at, created_at',
        )
        .eq('account_id', ctx.accountId)
        .order('created_at', { ascending: false })
        .limit(25),
      ctx.supabase
        .from('message_templates')
        .select('name, language, category, status')
        .eq('account_id', ctx.accountId)
        .eq('status', 'APPROVED')
        .order('updated_at', { ascending: false }),
    ]);

    if (logsErr) {
      return NextResponse.json({ error: logsErr.message }, { status: 500 });
    }

    const templates = (authTemplates ?? []) as Array<{
      name: string;
      language: string;
      category: string;
      status: string;
    }>;

    return NextResponse.json({
      logs: logs ?? [],
      approvedTemplates: templates,
      hasAuthTemplate: templates.some((t) => t.category === 'AUTHENTICATION'),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

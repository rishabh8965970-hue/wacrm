import { NextResponse } from 'next/server';
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account';
import {
  billingAdminClient,
  getEffectiveSubscriptionForAccount,
  isRazorpayConfigured,
  isSuperAdminEmail,
} from '@/lib/billing/server';

export async function GET() {
  try {
    const ctx = await getCurrentAccount();
    const {
      data: { user },
    } = await ctx.supabase.auth.getUser();
    const email = user?.email ?? null;

    const { row, effective } = await getEffectiveSubscriptionForAccount(
      ctx.accountId,
      email,
    );

    const admin = billingAdminClient();
    const { data: payments } = await admin
      .from('billing_payments')
      .select('id, plan_id, amount_paise, currency, status, razorpay_order_id, razorpay_payment_id, created_at')
      .eq('account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      subscription: row,
      effective,
      payments: payments ?? [],
      razorpayConfigured: isRazorpayConfigured(),
      isSuperAdmin: isSuperAdminEmail(email),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

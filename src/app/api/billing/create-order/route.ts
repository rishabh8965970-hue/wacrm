import { NextResponse } from 'next/server';
import { requireRole, toErrorResponse } from '@/lib/auth/account';
import { BILLING_PLANS, isPaidPlanId } from '@/lib/billing/plans';
import {
  billingAdminClient,
  createRazorpayOrder,
  formatOrderReceipt,
  isRazorpayConfigured,
} from '@/lib/billing/server';

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('admin');
    const body = (await request.json().catch(() => ({}))) as {
      planId?: unknown;
    };

    if (!isPaidPlanId(body.planId)) {
      return NextResponse.json(
        { error: 'Please select Growth or Business plan.' },
        { status: 400 },
      );
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          error:
            'Razorpay checkout is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Hostinger Environment Variables.',
        },
        { status: 503 },
      );
    }

    const plan = BILLING_PLANS[body.planId];
    const order = await createRazorpayOrder({
      amountPaise: plan.amountPaise,
      receipt: formatOrderReceipt(ctx.accountId),
      notes: {
        account_id: ctx.accountId,
        user_id: ctx.userId,
        plan_id: plan.id,
      },
    });

    const admin = billingAdminClient();
    await admin.from('billing_payments').insert({
      account_id: ctx.accountId,
      user_id: ctx.userId,
      plan_id: plan.id,
      amount_paise: order.amount,
      currency: order.currency,
      status: 'created',
      razorpay_order_id: order.id,
      notes: { account_name: ctx.account.name },
    });

    const {
      data: { user },
    } = await ctx.supabase.auth.getUser();

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID!.trim(),
      planId: plan.id,
      planName: plan.name,
      accountName: ctx.account.name,
      email: user?.email ?? '',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('Razorpay')) {
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return toErrorResponse(err);
  }
}

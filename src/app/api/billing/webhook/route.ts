import { NextResponse } from 'next/server';
import { isPaidPlanId } from '@/lib/billing/plans';
import {
  activateAccountPlan,
  billingAdminClient,
  verifyRazorpayWebhookSignature,
} from '@/lib/billing/server';

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        notes?: Record<string, string>;
      };
    };
  };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Razorpay webhook secret not configured' },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  if (
    !signature ||
    !verifyRazorpayWebhookSignature({ rawBody, signature, webhookSecret })
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let parsed: RazorpayWebhookPayload;
  try {
    parsed = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (parsed.event === 'payment.captured' || parsed.event === 'order.paid') {
    const entity = parsed.payload?.payment?.entity;
    const orderId = entity?.order_id;
    const paymentId = entity?.id;

    if (orderId && paymentId) {
      const admin = billingAdminClient();
      const { data: row } = await admin
        .from('billing_payments')
        .select('id, account_id, plan_id, status')
        .eq('razorpay_order_id', orderId)
        .maybeSingle();

      if (row && isPaidPlanId(row.plan_id) && row.status !== 'paid') {
        await admin
          .from('billing_payments')
          .update({
            status: 'paid',
            razorpay_payment_id: paymentId,
          })
          .eq('id', row.id);

        await activateAccountPlan({
          accountId: row.account_id,
          planId: row.plan_id,
          days: 30,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

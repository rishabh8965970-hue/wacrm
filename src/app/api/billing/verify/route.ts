import { NextResponse } from 'next/server';
import { requireRole, toErrorResponse } from '@/lib/auth/account';
import { isPaidPlanId } from '@/lib/billing/plans';
import {
  activateAccountPlan,
  billingAdminClient,
  verifyRazorpayPaymentSignature,
} from '@/lib/billing/server';

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('admin');
    const body = (await request.json().catch(() => ({}))) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const orderId = body.razorpay_order_id?.trim() ?? '';
    const paymentId = body.razorpay_payment_id?.trim() ?? '';
    const signature = body.razorpay_signature?.trim() ?? '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? '';

    if (!orderId || !paymentId || !signature || !keySecret) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment verification parameters.' },
        { status: 400 },
      );
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
      keySecret,
    });
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid payment signature.' },
        { status: 400 },
      );
    }

    const admin = billingAdminClient();
    const { data: paymentRow } = await admin
      .from('billing_payments')
      .select('id, account_id, plan_id, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (!paymentRow || paymentRow.account_id !== ctx.accountId) {
      return NextResponse.json(
        { error: 'Order does not belong to this workspace.' },
        { status: 403 },
      );
    }

    if (!isPaidPlanId(paymentRow.plan_id)) {
      return NextResponse.json({ error: 'Invalid plan on order.' }, { status: 400 });
    }

    if (paymentRow.status !== 'paid') {
      await admin
        .from('billing_payments')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        })
        .eq('id', paymentRow.id);
    }

    const subscription = await activateAccountPlan({
      accountId: ctx.accountId,
      planId: paymentRow.plan_id,
      days: 30,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
    });

    return NextResponse.json({ ok: true, subscription });
  } catch (err) {
    return toErrorResponse(err);
  }
}

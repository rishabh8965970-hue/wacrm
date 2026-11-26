import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  BILLING_PLANS,
  resolveEffectiveSubscription,
  type BillingPlanId,
  type BillingSubscriptionRow,
  type EffectiveSubscription,
} from './plans';

const DEFAULT_SUPER_ADMINS = ['rishabhsinghharda@gmail.com'];
const THIRTY_DAYS_MS = 30 * 86_400_000;

let _adminClient: SupabaseClient | null = null;

export function billingAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _adminClient;
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const configured = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const allowList = configured.length > 0 ? configured : DEFAULT_SUPER_ADMINS;
  return allowList.includes(normalized);
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

function safeHexEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = createHmac('sha256', params.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');
  return safeHexEqual(expected, params.signature);
}

export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expected = createHmac('sha256', params.webhookSecret)
    .update(params.rawBody)
    .digest('hex');
  return safeHexEqual(expected, params.signature);
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    amount?: number;
    currency?: string;
    error?: { description?: string };
  };
  if (!res.ok || !data.id) {
    throw new Error(
      data.error?.description ?? `Razorpay order creation failed (HTTP ${res.status})`,
    );
  }
  return {
    id: data.id,
    amount: data.amount ?? params.amountPaise,
    currency: data.currency ?? 'INR',
  };
}

export async function ensureAccountSubscription(
  accountId: string,
): Promise<BillingSubscriptionRow | null> {
  const admin = billingAdminClient();
  const { data: existing } = await admin
    .from('billing_subscriptions')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();

  if (existing) {
    return existing as BillingSubscriptionRow;
  }

  const { data: inserted } = await admin
    .from('billing_subscriptions')
    .upsert(
      {
        account_id: accountId,
        plan_id: 'trial',
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
      { onConflict: 'account_id' },
    )
    .select('*')
    .single();

  return (inserted as BillingSubscriptionRow | null) ?? null;
}

export async function getEffectiveSubscriptionForAccount(
  accountId: string,
  userEmail?: string | null,
): Promise<{
  row: BillingSubscriptionRow | null;
  effective: EffectiveSubscription;
}> {
  const row = await ensureAccountSubscription(accountId);
  const effective = resolveEffectiveSubscription(row, {
    isSuperAdmin: isSuperAdminEmail(userEmail),
  });
  return { row, effective };
}

export async function activateAccountPlan(params: {
  accountId: string;
  planId: BillingPlanId;
  days?: number;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}): Promise<BillingSubscriptionRow> {
  const admin = billingAdminClient();
  const now = new Date();
  const durationDays = params.days ?? 30;
  const end = new Date(now.getTime() + durationDays * 86_400_000);

  const payload =
    params.planId === 'trial'
      ? {
          account_id: params.accountId,
          plan_id: 'trial',
          status: 'trialing',
          trial_ends_at: end.toISOString(),
        }
      : params.planId === 'starter'
        ? {
            account_id: params.accountId,
            plan_id: 'starter',
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: null,
          }
        : {
            account_id: params.accountId,
            plan_id: params.planId,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: end.toISOString(),
            ...(params.razorpayOrderId ? { razorpay_order_id: params.razorpayOrderId } : {}),
            ...(params.razorpayPaymentId
              ? { razorpay_payment_id: params.razorpayPaymentId }
              : {}),
          };

  const { data, error } = await admin
    .from('billing_subscriptions')
    .upsert(payload, { onConflict: 'account_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update subscription');
  }
  return data as BillingSubscriptionRow;
}

export async function checkAccountPlanFeature(
  accountId: string,
  feature: 'broadcasts' | 'automations' | 'api',
  userEmail?: string | null,
): Promise<{ allowed: boolean; effective: EffectiveSubscription }> {
  const { effective } = await getEffectiveSubscriptionForAccount(
    accountId,
    userEmail,
  );
  const allowed =
    feature === 'broadcasts'
      ? effective.allowsBroadcasts
      : feature === 'automations'
        ? effective.allowsAutomations
        : effective.allowsApi;

  return { allowed, effective };
}

export function formatOrderReceipt(accountId: string): string {
  const cleanId = accountId.replace(/-/g, '').slice(0, 12);
  const ts = Math.floor(Date.now() / 1000).toString(36);
  return `cs_${cleanId}_${ts}`.slice(0, 40);
}

export { BILLING_PLANS, THIRTY_DAYS_MS };

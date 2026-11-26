export type BillingPlanId = 'trial' | 'starter' | 'growth' | 'business';
export type BillingStatus = 'trialing' | 'active' | 'expired' | 'cancelled';

export interface BillingPlanSpec {
  id: BillingPlanId;
  name: string;
  priceInr: number;
  amountPaise: number;
  badge: string;
  description: string;
  features: readonly string[];
  allowsBroadcasts: boolean;
  allowsAutomations: boolean;
  allowsApi: boolean;
  maxMembers: number;
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlanSpec> = {
  trial: {
    id: 'trial',
    name: '7-Day Free Trial',
    priceInr: 0,
    amountPaise: 0,
    badge: 'Trial',
    description: 'Full Growth access for 7 days to test inbox, flows, and broadcasts.',
    features: [
      'Shared Inbox & Pipelines',
      'Bulk Template Broadcasts',
      'Automations, Flows & AI Assistant',
      'Up to 5 team members',
    ],
    allowsBroadcasts: true,
    allowsAutomations: true,
    allowsApi: true,
    maxMembers: 5,
  },
  starter: {
    id: 'starter',
    name: 'Starter Workspace',
    priceInr: 0,
    amountPaise: 0,
    badge: 'Free',
    description: 'Core WhatsApp inbox and CRM contacts with your own Meta Cloud API.',
    features: [
      '1 Official WhatsApp Business Number',
      'Shared Inbox, Contacts & Pipelines',
      'Meta Template Sync & Manual Replies',
    ],
    allowsBroadcasts: false,
    allowsAutomations: false,
    allowsApi: false,
    maxMembers: 1,
  },
  growth: {
    id: 'growth',
    name: 'Growth & Automation',
    priceInr: 999,
    amountPaise: 99900,
    badge: 'Most Popular',
    description: 'Bulk broadcasts, visual chatbots, wait automations, and AI replies.',
    features: [
      'Everything in Starter Workspace',
      'Unlimited Bulk Template Broadcasts',
      'Visual Flow Builder & Wait Automations',
      'AI Reply Assistant & Knowledge Base (BYOK)',
      'Up to 5 team members',
    ],
    allowsBroadcasts: true,
    allowsAutomations: true,
    allowsApi: false,
    maxMembers: 5,
  },
  business: {
    id: 'business',
    name: 'Business & API',
    priceInr: 2499,
    amountPaise: 249900,
    badge: 'API & Multi-Team',
    description: 'Full REST API, webhooks, and unlimited team members for scaling teams.',
    features: [
      'Everything in Growth & Automation',
      'Public REST API (/api/v1) & Scoped Keys',
      'HMAC-Signed Outbound Webhooks',
      'Unlimited team members',
    ],
    allowsBroadcasts: true,
    allowsAutomations: true,
    allowsApi: true,
    maxMembers: 1000,
  },
};

export interface BillingSubscriptionRow {
  id: string;
  account_id: string;
  plan_id: BillingPlanId;
  status: BillingStatus;
  trial_ends_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EffectiveSubscription {
  planId: BillingPlanId;
  planName: string;
  status: BillingStatus;
  isActive: boolean;
  daysRemaining: number;
  expiresAt: string | null;
  isSuperAdmin: boolean;
  allowsBroadcasts: boolean;
  allowsAutomations: boolean;
  allowsApi: boolean;
}

const MS_PER_DAY = 86_400_000;

export function isPaidPlanId(value: unknown): value is 'growth' | 'business' {
  return value === 'growth' || value === 'business';
}

export function isValidPlanId(value: unknown): value is BillingPlanId {
  return value === 'trial' || value === 'starter' || value === 'growth' || value === 'business';
}

/**
 * Compute live entitlement state from a persisted subscription row.
 * Platform super-admins always receive full Business-tier access.
 */
export function resolveEffectiveSubscription(
  row: BillingSubscriptionRow | null,
  options?: { isSuperAdmin?: boolean; now?: Date },
): EffectiveSubscription {
  const isSuperAdmin = Boolean(options?.isSuperAdmin);
  if (isSuperAdmin) {
    const spec = BILLING_PLANS.business;
    return {
      planId: 'business',
      planName: 'Platform Owner (Business)',
      status: 'active',
      isActive: true,
      daysRemaining: 365,
      expiresAt: row?.current_period_end ?? null,
      isSuperAdmin: true,
      allowsBroadcasts: spec.allowsBroadcasts,
      allowsAutomations: spec.allowsAutomations,
      allowsApi: spec.allowsApi,
    };
  }

  const nowMs = (options?.now ?? new Date()).getTime();
  if (!row) {
    const spec = BILLING_PLANS.trial;
    return {
      planId: 'trial',
      planName: spec.name,
      status: 'trialing',
      isActive: true,
      daysRemaining: 7,
      expiresAt: null,
      isSuperAdmin: false,
      allowsBroadcasts: spec.allowsBroadcasts,
      allowsAutomations: spec.allowsAutomations,
      allowsApi: spec.allowsApi,
    };
  }

  if (row.plan_id === 'starter') {
    const spec = BILLING_PLANS.starter;
    return {
      planId: 'starter',
      planName: spec.name,
      status: 'active',
      isActive: true,
      daysRemaining: 0,
      expiresAt: null,
      isSuperAdmin: false,
      allowsBroadcasts: spec.allowsBroadcasts,
      allowsAutomations: spec.allowsAutomations,
      allowsApi: spec.allowsApi,
    };
  }

  const expiryIso =
    row.plan_id === 'trial' ? row.trial_ends_at : row.current_period_end;
  const expiryMs = expiryIso ? new Date(expiryIso).getTime() : 0;
  const remainingMs = expiryMs - nowMs;
  const daysRemaining = expiryIso ? Math.max(0, Math.ceil(remainingMs / MS_PER_DAY)) : 0;
  const active =
    row.status !== 'cancelled' &&
    row.status !== 'expired' &&
    (expiryMs === 0 ? row.status === 'active' : remainingMs > 0);

  const effectivePlan = active ? BILLING_PLANS[row.plan_id] : BILLING_PLANS.starter;
  const effectiveStatus: BillingStatus = active
    ? row.plan_id === 'trial'
      ? 'trialing'
      : 'active'
    : 'expired';

  return {
    planId: row.plan_id,
    planName: BILLING_PLANS[row.plan_id].name,
    status: effectiveStatus,
    isActive: active,
    daysRemaining,
    expiresAt: expiryIso,
    isSuperAdmin: false,
    allowsBroadcasts: effectivePlan.allowsBroadcasts,
    allowsAutomations: effectivePlan.allowsAutomations,
    allowsApi: effectivePlan.allowsApi,
  };
    }

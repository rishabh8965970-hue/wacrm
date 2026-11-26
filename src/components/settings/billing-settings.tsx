'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SettingsPanelHead } from './settings-panel-head';
import {
  BILLING_PLANS,
  type BillingPlanId,
  type EffectiveSubscription,
} from '@/lib/billing/plans';

interface PaymentRecord {
  id: string;
  plan_id: BillingPlanId;
  amount_paise: number;
  currency: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
}

interface AdminWorkspaceRow {
  accountId: string;
  accountName: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
  effective: EffectiveSubscription;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayWindow {
  Razorpay?: new (options: Record<string, unknown>) => {
    open: () => void;
    on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void;
  };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as RazorpayWindow).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState<'growth' | 'business' | null>(null);
  const [effective, setEffective] = useState<EffectiveSubscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [adminLoading, setAdminLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceRow[]>([]);
  const [revenueInr, setRevenueInr] = useState(0);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/status', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load billing');
      setEffective(data.effective);
      setPayments(data.payments ?? []);
      setRazorpayConfigured(Boolean(data.razorpayConfigured));
      setIsSuperAdmin(Boolean(data.isSuperAdmin));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminWorkspaces = useCallback(async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/billing/admin', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setWorkspaces(data.workspaces ?? []);
      setRevenueInr(data.totalRevenueInr ?? 0);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdminWorkspaces();
    }
  }, [isSuperAdmin, fetchAdminWorkspaces]);

  const handleUpgrade = async (planId: 'growth' | 'business') => {
    setPayingPlan(planId);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Could not load Razorpay Checkout script.');
      }

      const orderRes = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(order.error ?? 'Failed to create Razorpay order');
      }

      const RazorpayCtor = (window as unknown as RazorpayWindow).Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay SDK unavailable');
      }

      const rzp = new RazorpayCtor({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ChatStack WhatsApp CRM',
        description: `${order.planName} — 30 Days`,
        order_id: order.orderId,
        prefill: {
          name: order.accountName,
          email: order.email,
        },
        theme: { color: '#10b981' },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verifyRes = await fetch('/api/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error ?? 'Payment verification failed');
            }
            toast.success(`${order.planName} activated for 30 days!`);
            await fetchStatus();
            if (isSuperAdmin) await fetchAdminWorkspaces();
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : 'Verification failed',
            );
          } finally {
            setPayingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setPayingPlan(null),
        },
      });

      rzp.on('payment.failed', (res) => {
        toast.error(res.error?.description ?? 'Payment failed');
        setPayingPlan(null);
      });

      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout');
      setPayingPlan(null);
    }
  };

  const handleAdminPlanChange = async (
    accountId: string,
    planId: BillingPlanId,
    days = 30,
  ) => {
    setUpdatingAccountId(accountId);
    try {
      const res = await fetch('/api/billing/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, planId, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update plan');
      toast.success('Customer plan updated');
      await fetchAdminWorkspaces();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingAccountId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPanelHead
        title="Billing & plans"
        description="Manage your ChatStack WhatsApp CRM subscription. Meta per-message fees are billed separately by Meta to your own Business Manager card."
      />

      {loading ? (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading billing status...
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Plan Card */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">
                    {effective?.planName ?? '7-Day Free Trial'}
                  </CardTitle>
                  <span
                    className={
                      effective?.isActive
                        ? 'rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400'
                        : 'rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400'
                    }
                  >
                    {effective?.status.toUpperCase()}
                  </span>
                </div>
                <CardDescription className="mt-1">
                  {effective?.isSuperAdmin
                    ? 'Platform Owner account — unrestricted access enabled.'
                    : effective?.planId === 'starter'
                      ? 'Free Starter plan — upgrade to unlock Bulk Broadcasts, Flows, Automations, and API.'
                      : effective?.isActive
                        ? `${effective.daysRemaining} day(s) remaining${
                            effective.expiresAt
                              ? ` (valid until ${new Date(effective.expiresAt).toLocaleDateString()})`
                              : ''
                          }.`
                        : 'Your trial or billing period has ended. Upgrade below to re-enable broadcasts & automations.'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                className="shrink-0"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Meta WhatsApp Cloud API per-message charges (Marketing ₹0.8631,
                  Utility/Auth ₹0.1150, first 1,000 Service replies free) are
                  billed directly by Meta to your own connected Meta Business
                  Manager card—0% markup from ChatStack.
                </span>
              </div>

              {!razorpayConfigured && (
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-300">
                  Razorpay Checkout is waiting for <code>RAZORPAY_KEY_ID</code> and{' '}
                  <code>RAZORPAY_KEY_SECRET</code> in Hostinger Environment
                  Variables.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upgrade Plan Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {(['growth', 'business'] as const).map((planId) => {
              const plan = BILLING_PLANS[planId];
              const isCurrent =
                effective?.planId === planId && effective?.isActive && !effective?.isSuperAdmin;
              const isLoading = payingPlan === planId;

              return (
                <Card
                  key={plan.id}
                  className={
                    planId === 'growth'
                      ? 'border-emerald-500/40 bg-card'
                      : 'border-border bg-card'
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {planId === 'growth' ? (
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Crown className="h-4 w-4 text-amber-400" />
                        )}
                        {plan.name}
                      </CardTitle>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                        {plan.badge}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">
                        ₹{plan.priceInr.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 30 days</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      disabled={isLoading || isCurrent}
                      onClick={() => handleUpgrade(planId)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening Razorpay...
                        </>
                      ) : isCurrent ? (
                        'Current Active Plan'
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay ₹{plan.priceInr.toLocaleString('en-IN')} via Razorpay
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Payment History */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
              <CardDescription>
                Recent Razorpay transactions for this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Plan</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Payment ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-4 font-medium capitalize">
                            {p.plan_id}
                          </td>
                          <td className="py-2 pr-4">
                            ₹{(p.amount_paise / 100).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 pr-4 capitalize">{p.status}</td>
                          <td className="py-2 font-mono text-[11px] text-muted-foreground">
                            {p.razorpay_payment_id ?? p.razorpay_order_id ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Super Admin Section */}
          {isSuperAdmin && (
            <Card className="border-amber-500/30 bg-card">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-4 w-4 text-amber-400" />
                    Platform Admin — Customer Subscriptions
                  </CardTitle>
                  <CardDescription>
                    Total workspaces: {workspaces.length} · Verified Razorpay
                    revenue: ₹{revenueInr.toLocaleString('en-IN')}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAdminWorkspaces}
                  disabled={adminLoading}
                >
                  {adminLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Reload'
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-3">Workspace</th>
                        <th className="py-2 pr-3">Owner Email</th>
                        <th className="py-2 pr-3">Plan / Status</th>
                        <th className="py-2 pr-3">Days Left</th>
                        <th className="py-2">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {workspaces.map((ws) => (
                        <tr key={ws.accountId}>
                          <td className="py-2.5 pr-3 font-medium">
                            {ws.accountName}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {ws.ownerEmail}
                          </td>
                          <td className="py-2.5 pr-3 capitalize">
                            {ws.effective.planId} ({ws.effective.status})
                          </td>
                          <td className="py-2.5 pr-3">
                            {ws.effective.isSuperAdmin
                              ? 'Unlimited'
                              : ws.effective.daysRemaining}
                          </td>
                          <td className="py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px]"
                                disabled={updatingAccountId === ws.accountId}
                                onClick={() =>
                                  handleAdminPlanChange(ws.accountId, 'growth', 30)
                                }
                              >
                                Growth 30d
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px]"
                                disabled={updatingAccountId === ws.accountId}
                                onClick={() =>
                                  handleAdminPlanChange(ws.accountId, 'business', 30)
                                }
                              >
                                Business 30d
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px]"
                                disabled={updatingAccountId === ws.accountId}
                                onClick={() =>
                                  handleAdminPlanChange(ws.accountId, 'trial', 7)
                                }
                              >
                                Trial 7d
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
                }

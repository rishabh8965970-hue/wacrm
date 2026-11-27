'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Coins,
  ExternalLink,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMetaMoney, type MetaUsageResponse } from '@/lib/whatsapp/meta-usage';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

type TrackerMode = 'sync' | 'recharge' | 'custom' | null;

function formatRangeLabel(days: number): string {
  if (days === 1) return 'Today';
  return `Last ${days} days`;
}

export function MetaUsageCard({ range = 7 }: { range?: number }) {
  const { canEditSettings } = useAuth();
  const [data, setData] = useState<MetaUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [mode, setMode] = useState<TrackerMode>(null);
  const [amountInput, setAmountInput] = useState('');
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [thresholdInput, setThresholdInput] = useState('100');
  const [savingWallet, setSavingWallet] = useState(false);

  const loadUsage = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(`/api/whatsapp/usage?days=${encodeURIComponent(String(range))}`, {
          cache: 'no-store',
        });
        const payload = (await res.json()) as MetaUsageResponse & { error?: string };
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to load Meta usage report');
        }
        setData(payload);
        if (payload.wallet?.configured) {
          setThresholdInput(String(payload.wallet.lowBalanceThreshold ?? 100));
          setDateInput(payload.wallet.trackingSince || new Date().toISOString().slice(0, 10));
        }
      } catch (err) {
        if (silent) {
          toast.error(err instanceof Error ? err.message : 'Failed to refresh Meta usage');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range],
  );

  useEffect(() => {
    loadUsage(false);
  }, [loadUsage]);

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mode) return;
    const numericAmount = Number(amountInput);
    const numericThreshold = Number(thresholdInput);

    if (!Number.isFinite(numericAmount) || numericAmount < 0 || (mode === 'recharge' && numericAmount <= 0)) {
      toast.error(
        mode === 'recharge'
          ? 'Enter a valid recharge amount greater than 0.'
          : 'Enter a valid non-negative wallet amount.',
      );
      return;
    }

    setSavingWallet(true);
    try {
      const payload =
        mode === 'sync'
          ? {
              action: 'sync_balance',
              balance: numericAmount,
              lowBalanceThreshold: Number.isFinite(numericThreshold) ? numericThreshold : 100,
            }
          : mode === 'recharge'
            ? {
                action: 'add_recharge',
                amount: numericAmount,
                lowBalanceThreshold: Number.isFinite(numericThreshold) ? numericThreshold : 100,
              }
            : {
                action: 'set_tracker',
                fundedAmount: numericAmount,
                trackingSince: dateInput,
                lowBalanceThreshold: Number.isFinite(numericThreshold) ? numericThreshold : 100,
              };

      const res = await fetch('/api/whatsapp/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update Meta wallet tracker');
      }

      toast.success(
        mode === 'recharge'
          ? 'Manual top-up logged in CRM wallet tracker.'
          : 'Meta wallet tracker updated.',
      );
      setMode(null);
      setAmountInput('');
      await loadUsage(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update wallet tracker');
    } finally {
      setSavingWallet(false);
    }
  };

  const rangeLabel = formatRangeLabel(range);
  const currency = data?.currency || 'INR';

  return (
    <Card id="meta-spend">
      <CardHeader>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Coins className="size-4 text-primary" aria-hidden />
              Meta WhatsApp Spend &amp; Wallet
            </CardTitle>
            {data?.wabaName && (
              <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {data.wabaName}
              </span>
            )}
            {data?.wallet.isLowBalance && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                <AlertTriangle className="size-3" aria-hidden />
                Low estimated balance
              </span>
            )}
          </div>
          <CardDescription>
            Live Meta message pricing &amp; delivered counts ({rangeLabel}) plus your estimated
            prepaid wallet balance.
          </CardDescription>
        </div>

        <CardAction>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => loadUsage(true)}
              disabled={loading || refreshing}
              title="Refresh from Meta"
            >
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} aria-hidden />
              <span className="sr-only sm:not-sr-only">Refresh</span>
            </Button>
            <a
              href="https://business.facebook.com/latest/billing_hub/accounts"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Meta Billing
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && !data ? (
          <Skeleton className="h-44 w-full" />
        ) : !data || data.state === 'disconnected' ? (
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Connect your WhatsApp Business API to view live Meta spend
              </p>
              <p className="text-xs text-muted-foreground">
                Once connected, message costs and paid/free breakdowns sync straight from Meta.
              </p>
            </div>
            <Link href="/settings?tab=whatsapp" className={buttonVariants({ size: 'sm' })}>
              Connect WhatsApp
            </Link>
          </div>
        ) : data.state === 'missing_waba' ? (
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">WABA ID needed for cost sync</p>
              <p className="text-xs text-muted-foreground">{data.error}</p>
            </div>
            <Link
              href="/settings?tab=whatsapp"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Update Settings
            </Link>
          </div>
        ) : (
          <>
            {data.state === 'unavailable' && data.error && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                <span>Meta Analytics temporarily unavailable: {data.error}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => loadUsage(true)}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* 4 Key Metrics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Meta Spend ({rangeLabel})</span>
                  <TrendingUp className="size-3.5" aria-hidden />
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {data.costAvailable ? formatMetaMoney(data.totals.cost, currency) : 'N/A'}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {data.costAvailable
                    ? `Currency: ${currency} via Meta Insights`
                    : 'Cost hidden (BSP-billed account)'}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Delivered Messages</span>
                  <MessageSquare className="size-3.5" aria-hidden />
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {data.totals.volume.toLocaleString()}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {data.totals.paidVolume} paid · {data.totals.freeVolume} free service
                </p>
              </div>

              <div
                className={cn(
                  'rounded-lg border p-3',
                  data.wallet.isLowBalance
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-border bg-muted/30',
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Estimated Wallet Left</span>
                  <Coins className="size-3.5" aria-hidden />
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {data.wallet.configured
                    ? formatMetaMoney(data.wallet.estimatedRemaining, currency)
                    : 'Not synced'}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {data.wallet.configured
                    ? `Tracked since ${data.wallet.trackingSince}`
                    : 'Click Sync Balance to estimate'}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Wallet Funded / Spent</span>
                  <SlidersHorizontal className="size-3.5" aria-hidden />
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {data.wallet.configured
                    ? formatMetaMoney(data.wallet.fundedAmount, currency)
                    : '—'}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {data.wallet.configured
                    ? `Deducted: ${formatMetaMoney(data.wallet.spendSinceTracking, currency)}`
                    : 'Set prepaid balance below'}
                </p>
              </div>
            </div>

            {/* Category Breakdown + Daily History */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
                  Category Breakdown ({rangeLabel})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 text-right font-medium">Delivered</th>
                        <th className="px-3 py-2 text-right font-medium">Paid</th>
                        <th className="px-3 py-2 text-right font-medium">Free</th>
                        <th className="px-3 py-2 text-right font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.categories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                            No delivered message metrics in this range yet.
                          </td>
                        </tr>
                      ) : (
                        data.categories.map((cat) => (
                          <tr key={cat.category}>
                            <td className="px-3 py-2 font-medium text-foreground">{cat.label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{cat.volume}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {cat.paidVolume}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {cat.freeVolume}
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">
                              {data.costAvailable ? formatMetaMoney(cat.cost, currency) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
                  Daily Meta Spend History
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date (UTC)</th>
                        <th className="px-3 py-2 text-right font-medium">Delivered</th>
                        <th className="px-3 py-2 text-right font-medium">Paid / Free</th>
                        <th className="px-3 py-2 text-right font-medium">Approx Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.daily.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                            Daily pricing metrics will appear once Meta processes deliveries.
                          </td>
                        </tr>
                      ) : (
                        data.daily
                          .slice()
                          .reverse()
                          .map((day) => (
                            <tr key={day.date}>
                              <td className="px-3 py-2 font-medium text-foreground">{day.label}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{day.volume}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                {day.paidVolume} / {day.freeVolume}
                              </td>
                              <td className="px-3 py-2 text-right font-medium tabular-nums">
                                {data.costAvailable ? formatMetaMoney(day.cost, currency) : '—'}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Wallet Controls */}
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-foreground">
                    Estimated Meta Prepaid Wallet Tracker
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Meta does not expose your exact Billing Hub balance over API — enter your
                    current Meta balance or top-up to track remaining funds automatically.
                  </p>
                </div>

                {canEditSettings && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href="https://business.facebook.com/latest/billing_hub/accounts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'h-7 px-2.5 text-xs')}
                    >
                      Add Funds in Meta
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                    <Button
                      type="button"
                      size="sm"
                      variant={mode === 'sync' ? 'secondary' : 'outline'}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => {
                        setMode(mode === 'sync' ? null : 'sync');
                        setAmountInput('');
                      }}
                    >
                      Sync Meta Balance
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={mode === 'recharge' ? 'secondary' : 'outline'}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => {
                        setMode(mode === 'recharge' ? null : 'recharge');
                        setAmountInput('');
                      }}
                    >
                      <Plus className="size-3" aria-hidden />
                      Log Meta Top-up (Manual)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={mode === 'custom' ? 'secondary' : 'ghost'}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => {
                        setMode(mode === 'custom' ? null : 'custom');
                        setAmountInput(
                          data.wallet.configured ? String(data.wallet.fundedAmount) : '',
                        );
                      }}
                    >
                      Set Starting Date
                    </Button>
                  </div>
                )}
              </div>

              {mode && canEditSettings && (
                <form
                  onSubmit={handleSaveWallet}
                  className="mt-3 space-y-3 border-t border-border pt-3"
                >
                  <p className="text-[11px] text-amber-500">
                    Manual tracker only — this updates your CRM estimate without charging your bank
                    or adding real funds to Meta. Complete real payments via Add Funds in Meta
                    first.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
                    <div className="space-y-1">
                      <Label htmlFor="meta-wallet-amount" className="text-xs">
                        {mode === 'sync'
                          ? `Current Meta Balance (${currency})`
                          : mode === 'recharge'
                            ? `Manual Top-up Amount (${currency})`
                            : `Total Funded (${currency})`}
                      </Label>
                      <Input
                        id="meta-wallet-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={mode === 'sync' ? 'e.g. 494.90' : 'e.g. 500'}
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    {mode === 'custom' && (
                      <div className="space-y-1">
                        <Label htmlFor="meta-wallet-date" className="text-xs">
                          Funded From Date
                        </Label>
                        <Input
                          id="meta-wallet-date"
                          type="date"
                          value={dateInput}
                          onChange={(e) => setDateInput(e.target.value)}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="meta-wallet-threshold" className="text-xs">
                        Low Balance Alert ({currency})
                      </Label>
                      <Input
                        id="meta-wallet-threshold"
                        type="number"
                        step="1"
                        min="0"
                        value={thresholdInput}
                        onChange={(e) => setThresholdInput(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="submit" size="sm" className="h-8 text-xs" disabled={savingWallet}>
                        {savingWallet && <Loader2 className="size-3 animate-spin" aria-hidden />}
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => setMode(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
                        }

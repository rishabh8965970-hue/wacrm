'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Sparkles } from 'lucide-react';
import type { EffectiveSubscription } from '@/lib/billing/plans';

export function BillingBanner() {
  const [effective, setEffective] = useState<EffectiveSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.effective) {
          setEffective(data.effective as EffectiveSubscription);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!effective || effective.isSuperAdmin) return null;

  if (!effective.isActive) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>
            Your workspace plan has expired. Bulk broadcasts, automations, and
            flows are paused.
          </span>
        </div>
        <Link
          href="/settings?tab=billing"
          className="rounded-full bg-red-500 px-3 py-1 font-semibold text-white hover:bg-red-400"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  if (effective.status === 'trialing') {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>
            7-Day Free Trial: <strong>{effective.daysRemaining} day(s)</strong>{' '}
            remaining.
          </span>
        </div>
        <Link
          href="/settings?tab=billing"
          className="font-semibold text-emerald-300 underline hover:text-emerald-200"
        >
          View Plans →
        </Link>
      </div>
    );
  }

  return null;
}

import { NextResponse } from 'next/server';
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account';
import { isValidPlanId, resolveEffectiveSubscription } from '@/lib/billing/plans';
import {
  activateAccountPlan,
  billingAdminClient,
  isSuperAdminEmail,
} from '@/lib/billing/server';

async function requireSuperAdmin() {
  const ctx = await getCurrentAccount();
  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!isSuperAdminEmail(user?.email)) {
    return null;
  }
  return ctx;
}

export async function GET() {
  try {
    const ctx = await requireSuperAdmin();
    if (!ctx) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = billingAdminClient();
    const [{ data: accounts }, { data: subs }, { data: owners }, { data: payments }] =
      await Promise.all([
        admin
          .from('accounts')
          .select('id, name, owner_user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        admin.from('billing_subscriptions').select('*'),
        admin
          .from('profiles')
          .select('account_id, email, full_name, account_role')
          .eq('account_role', 'owner'),
        admin
          .from('billing_payments')
          .select('id, account_id, plan_id, amount_paise, status, created_at')
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

    const subMap = new Map((subs ?? []).map((s) => [s.account_id, s]));
    const ownerMap = new Map((owners ?? []).map((o) => [o.account_id, o]));

    const workspaces = (accounts ?? []).map((acc) => {
      const sub = subMap.get(acc.id) ?? null;
      const owner = ownerMap.get(acc.id);
      const effective = resolveEffectiveSubscription(sub, {
        isSuperAdmin: isSuperAdminEmail(owner?.email),
      });
      return {
        accountId: acc.id,
        accountName: acc.name,
        ownerEmail: owner?.email ?? '',
        ownerName: owner?.full_name ?? '',
        createdAt: acc.created_at,
        subscription: sub,
        effective,
      };
    });

    const totalRevenueInr = (payments ?? []).reduce(
      (sum, p) => sum + Math.round((p.amount_paise ?? 0) / 100),
      0,
    );

    return NextResponse.json({
      workspaces,
      totalRevenueInr,
      paidCount: (payments ?? []).length,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireSuperAdmin();
    if (!ctx) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      accountId?: string;
      planId?: unknown;
      days?: number;
    };

    if (!body.accountId || !isValidPlanId(body.planId)) {
      return NextResponse.json(
        { error: 'accountId and valid planId are required.' },
        { status: 400 },
      );
    }

    const days =
      typeof body.days === 'number' && body.days >= 1 && body.days <= 3650
        ? Math.floor(body.days)
        : 30;

    const updated = await activateAccountPlan({
      accountId: body.accountId,
      planId: body.planId,
      days,
    });

    return NextResponse.json({ ok: true, subscription: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}

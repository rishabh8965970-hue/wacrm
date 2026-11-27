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
    const [
      { data: accounts },
      { data: subs },
      { data: profiles },
      { data: waConfigs },
      { data: payments },
    ] = await Promise.all([
      admin
        .from('accounts')
        .select('id, name, owner_user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      admin.from('billing_subscriptions').select('*'),
      admin
        .from('profiles')
        .select('user_id, account_id, email, full_name, account_role, created_at')
        .order('created_at', { ascending: false })
        .limit(1000),
      admin
        .from('whatsapp_config')
        .select('account_id, status, phone_number_id, waba_id, connected_at'),
      admin
        .from('billing_payments')
        .select('id, account_id, plan_id, amount_paise, status, created_at')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const subMap = new Map((subs ?? []).map((s) => [s.account_id, s]));
    const accountMap = new Map((accounts ?? []).map((a) => [a.id, a]));
    const waMap = new Map((waConfigs ?? []).map((w) => [w.account_id, w]));

    interface AdminProfileRow {
      user_id: string;
      account_id: string | null;
      email: string | null;
      full_name: string | null;
      account_role: string | null;
      created_at: string;
    }

    const profileRows = (profiles ?? []) as AdminProfileRow[];
    const ownerMap = new Map<string, AdminProfileRow>();
    const memberCountMap = new Map<string, number>();

    for (const p of profileRows) {
      if (!p.account_id) continue;
      memberCountMap.set(p.account_id, (memberCountMap.get(p.account_id) ?? 0) + 1);
      if (p.account_role === 'owner' || !ownerMap.has(p.account_id)) {
        ownerMap.set(p.account_id, p);
      }
    }

    const workspaces = (accounts ?? []).map((acc) => {
      const sub = subMap.get(acc.id) ?? null;
      const owner = ownerMap.get(acc.id);
      const wa = waMap.get(acc.id);
      const effective = resolveEffectiveSubscription(sub, {
        isSuperAdmin: isSuperAdminEmail(owner?.email),
      });
      return {
        accountId: acc.id,
        accountName: acc.name,
        ownerEmail: owner?.email ?? '',
        ownerName: owner?.full_name ?? '',
        memberCount: memberCountMap.get(acc.id) ?? 0,
        whatsappStatus: wa?.status ?? 'not_configured',
        whatsappConnected: wa?.status === 'connected',
        createdAt: acc.created_at,
        subscription: sub,
        effective,
      };
    });

    const workspaceEffectiveMap = new Map(
      workspaces.map((ws) => [ws.accountId, ws]),
    );

    const users = profileRows.map((p) => {
      const ws = p.account_id ? workspaceEffectiveMap.get(p.account_id) : undefined;
      const acc = p.account_id ? accountMap.get(p.account_id) : undefined;
      return {
        userId: p.user_id,
        fullName: p.full_name ?? '',
        email: p.email ?? '',
        role: p.account_role ?? 'viewer',
        accountId: p.account_id ?? null,
        workspaceName: acc?.name ?? ws?.accountName ?? '—',
        planId: ws?.effective.planId ?? 'trial',
        subscriptionStatus: ws?.effective.status ?? 'trialing',
        whatsappConnected: ws?.whatsappConnected ?? false,
        isSuperAdmin: isSuperAdminEmail(p.email),
        createdAt: p.created_at,
      };
    });

    const totalRevenueInr = (payments ?? []).reduce(
      (sum, p) => sum + Math.round((p.amount_paise ?? 0) / 100),
      0,
    );

    return NextResponse.json({
      workspaces,
      users,
      totalWorkspaces: workspaces.length,
      totalUsers: users.length,
      connectedWorkspaces: workspaces.filter((w) => w.whatsappConnected).length,
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

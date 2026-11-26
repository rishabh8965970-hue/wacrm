import { NextResponse } from 'next/server'
import { getCurrentAccount, requireRole, toErrorResponse } from '@/lib/auth/account'
import { billingAdminClient } from '@/lib/billing/server'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { decrypt } from '@/lib/whatsapp/encryption'
import { getWabaPricingAnalytics, MetaApiError } from '@/lib/whatsapp/meta-api'
import {
  aggregatePricingDataPoints,
  calculateWalletEstimate,
  roundMoney,
  type MetaUsageResponse,
  type MetaWalletTrackerState,
} from '@/lib/whatsapp/meta-usage'

const ALLOWED_DAYS = new Set([1, 7, 30, 90])
const MAX_LOOKBACK_DAYS = 365
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseDays(raw: string | null): number {
  const n = Number(raw)
  return ALLOWED_DAYS.has(n) ? n : 7
}

function getTodayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function utcMidnightSecForDaysAgo(daysAgo: number): number {
  const now = new Date()
  const ms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo)
  return Math.floor(ms / 1000)
}

function parseTrackerStartSec(isoDate: string): number {
  const parsed = Date.parse(`${isoDate}T00:00:00Z`)
  const minAllowed = Date.now() - MAX_LOOKBACK_DAYS * 86_400_000
  if (Number.isNaN(parsed)) return utcMidnightSecForDaysAgo(0)
  return Math.floor(Math.max(parsed, minAllowed) / 1000)
}

interface WalletTrackerRow {
  account_id: string
  waba_id: string | null
  currency: string
  funded_amount: number | string
  spend_offset: number | string
  tracking_since: string
  low_balance_threshold: number | string
  updated_at: string
}

function emptyWallet(trackingSince: string): MetaWalletTrackerState {
  return {
    configured: false,
    fundedAmount: 0,
    spendOffset: 0,
    trackingSince,
    lowBalanceThreshold: 100,
    spendSinceTracking: 0,
    estimatedRemaining: 0,
    isLowBalance: false,
    updatedAt: null,
  }
}

function buildEmptyResponse(
  state: MetaUsageResponse['state'],
  days: number,
  currency: string,
  wabaId: string | null,
  tracker: WalletTrackerRow | null,
  error?: string,
): MetaUsageResponse {
  const today = getTodayIsoUtc()
  const wallet = tracker
    ? calculateWalletEstimate({
        configured: true,
        fundedAmount: Number(tracker.funded_amount) || 0,
        spendOffset: Number(tracker.spend_offset) || 0,
        rawSpendSinceTracking: 0,
        lowBalanceThreshold: Number(tracker.low_balance_threshold) || 100,
        trackingSince: tracker.tracking_since,
        updatedAt: tracker.updated_at,
      })
    : emptyWallet(today)

  return {
    state,
    days,
    wabaId,
    wabaName: null,
    currency,
    costAvailable: false,
    ...(error ? { error } : {}),
    totals: { volume: 0, paidVolume: 0, freeVolume: 0, cost: 0 },
    categories: [],
    daily: [],
    wallet,
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, accountId, userId } = await getCurrentAccount()

    const limit = checkRateLimit(`whatsapp-usage:${userId}`, RATE_LIMITS.whatsappUsage)
    if (!limit.success) return rateLimitResponse(limit)

    const { searchParams } = new URL(request.url)
    const days = parseDays(searchParams.get('days'))

    const admin = billingAdminClient()
    const [{ data: config }, { data: accountRow }, { data: trackerRow }] = await Promise.all([
      supabase
        .from('whatsapp_config')
        .select('waba_id, phone_number_id, access_token, status')
        .eq('account_id', accountId)
        .maybeSingle(),
      supabase
        .from('accounts')
        .select('default_currency')
        .eq('id', accountId)
        .maybeSingle(),
      admin
        .from('meta_wallet_trackers')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle(),
    ])

    const tracker = (trackerRow as WalletTrackerRow | null) ?? null
    const fallbackCurrency =
      tracker?.currency ||
      (accountRow as { default_currency?: string } | null)?.default_currency ||
      'INR'

    if (!config || config.status !== 'connected' || !config.phone_number_id) {
      return NextResponse.json(
        buildEmptyResponse('disconnected', days, fallbackCurrency, null, tracker),
      )
    }

    if (!config.waba_id) {
      return NextResponse.json(
        buildEmptyResponse(
          'missing_waba',
          days,
          fallbackCurrency,
          null,
          tracker,
          'Save your WhatsApp Business Account ID (WABA ID) in Settings → WhatsApp to view Meta spend.',
        ),
      )
    }

    let accessToken: string
    try {
      accessToken = decrypt(config.access_token)
    } catch {
      return NextResponse.json(
        buildEmptyResponse(
          'unavailable',
          days,
          fallbackCurrency,
          config.waba_id,
          tracker,
          'Stored WhatsApp access token could not be decrypted.',
        ),
      )
    }

    const nowSec = Math.floor(Date.now() / 1000)
    const rangeStartSec = utcMidnightSecForDaysAgo(days - 1)

    try {
      const analytics = await getWabaPricingAnalytics({
        wabaId: config.waba_id,
        accessToken,
        startUnix: rangeStartSec,
        endUnix: nowSec,
      })

      const aggregated = aggregatePricingDataPoints(analytics.dataPoints)
      const currency = (analytics.currency || fallbackCurrency || 'INR').toUpperCase()

      let wallet = emptyWallet(getTodayIsoUtc())
      if (tracker) {
        const trackingStartSec = parseTrackerStartSec(tracker.tracking_since)
        let rawSpendSinceTracking = 0

        if (trackingStartSec >= rangeStartSec) {
          rawSpendSinceTracking = analytics.dataPoints
            .filter((p) => p.start >= trackingStartSec)
            .reduce((sum, p) => sum + (Number(p.cost) || 0), 0)
        } else {
          const sinceTracker = await getWabaPricingAnalytics({
            wabaId: config.waba_id,
            accessToken,
            startUnix: trackingStartSec,
            endUnix: nowSec,
          })
          rawSpendSinceTracking = sinceTracker.dataPoints.reduce(
            (sum, p) => sum + (Number(p.cost) || 0),
            0,
          )
        }

        wallet = calculateWalletEstimate({
          configured: true,
          fundedAmount: Number(tracker.funded_amount) || 0,
          spendOffset: Number(tracker.spend_offset) || 0,
          rawSpendSinceTracking,
          lowBalanceThreshold: Number(tracker.low_balance_threshold) || 100,
          trackingSince: tracker.tracking_since,
          updatedAt: tracker.updated_at,
        })
      }

      const body: MetaUsageResponse = {
        state: 'connected',
        days,
        wabaId: analytics.wabaId,
        wabaName: analytics.wabaName,
        currency,
        costAvailable: analytics.costAvailable,
        totals: aggregated.totals,
        categories: aggregated.categories,
        daily: aggregated.daily,
        wallet,
      }

      return NextResponse.json(body)
    } catch (err) {
      const message =
        err instanceof MetaApiError
          ? err.details || err.message
          : err instanceof Error
            ? err.message
            : 'Unable to load Meta pricing analytics'
      console.error('[whatsapp/usage GET] Meta pricing lookup failed:', message)
      return NextResponse.json(
        buildEmptyResponse('unavailable', days, fallbackCurrency, config.waba_id, tracker, message),
      )
    }
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')

    const limit = checkRateLimit(`whatsapp-usage-write:${userId}`, RATE_LIMITS.whatsappAdmin)
    if (!limit.success) return rateLimitResponse(limit)

    const body = (await request.json().catch(() => ({}))) as {
      action?: 'sync_balance' | 'add_recharge' | 'set_tracker'
      balance?: number
      amount?: number
      fundedAmount?: number
      trackingSince?: string
      lowBalanceThreshold?: number
    }

    const action = body.action
    if (!action || !['sync_balance', 'add_recharge', 'set_tracker'].includes(action)) {
      return NextResponse.json({ error: 'Invalid wallet tracker action' }, { status: 400 })
    }

    const admin = billingAdminClient()
    const [{ data: config }, { data: existingRow }] = await Promise.all([
      supabase
        .from('whatsapp_config')
        .select('waba_id, access_token, status')
        .eq('account_id', accountId)
        .maybeSingle(),
      admin
        .from('meta_wallet_trackers')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle(),
    ])

    const existing = existingRow as WalletTrackerRow | null
    const today = getTodayIsoUtc()
    const threshold =
      typeof body.lowBalanceThreshold === 'number' &&
      Number.isFinite(body.lowBalanceThreshold) &&
      body.lowBalanceThreshold >= 0
        ? roundMoney(body.lowBalanceThreshold)
        : existing
          ? roundMoney(Number(existing.low_balance_threshold) || 100)
          : 100

    let currency = existing?.currency || 'INR'
    let todaySpend = 0
    if (config?.waba_id && config.status === 'connected' && config.access_token) {
      try {
        const analytics = await getWabaPricingAnalytics({
          wabaId: config.waba_id,
          accessToken: decrypt(config.access_token),
          startUnix: utcMidnightSecForDaysAgo(0),
          endUnix: Math.floor(Date.now() / 1000),
        })
        if (analytics.currency) currency = analytics.currency.toUpperCase()
        todaySpend = roundMoney(
          analytics.dataPoints.reduce((sum, p) => sum + (Number(p.cost) || 0), 0),
        )
      } catch {
        // Non-fatal: save the tracker even if Meta analytics lookup fails.
      }
    }

    let nextFunded = Number(existing?.funded_amount) || 0
    let nextOffset = Number(existing?.spend_offset) || 0
    let nextSince = existing?.tracking_since || today

    if (action === 'sync_balance') {
      const balance = Number(body.balance)
      if (!Number.isFinite(balance) || balance < 0) {
        return NextResponse.json({ error: 'Enter a valid non-negative balance' }, { status: 400 })
      }
      nextFunded = roundMoney(balance)
      nextSince = today
      nextOffset = todaySpend
    } else if (action === 'add_recharge') {
      const amount = Number(body.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: 'Enter a recharge amount greater than 0' }, { status: 400 })
      }
      nextFunded = roundMoney((existing ? Number(existing.funded_amount) || 0 : 0) + amount)
      if (!existing) {
        nextSince = today
        nextOffset = todaySpend
      }
    } else if (action === 'set_tracker') {
      const fundedAmount = Number(body.fundedAmount)
      if (!Number.isFinite(fundedAmount) || fundedAmount < 0) {
        return NextResponse.json({ error: 'Enter a valid funded amount' }, { status: 400 })
      }
      if (body.trackingSince && !ISO_DATE_RE.test(body.trackingSince)) {
        return NextResponse.json({ error: 'Tracking start date must be YYYY-MM-DD' }, { status: 400 })
      }
      nextFunded = roundMoney(fundedAmount)
      nextSince = body.trackingSince || today
      nextOffset = 0
    }

    const { error: upsertError } = await admin.from('meta_wallet_trackers').upsert(
      {
        account_id: accountId,
        waba_id: config?.waba_id ?? existing?.waba_id ?? null,
        currency,
        funded_amount: nextFunded,
        spend_offset: nextOffset,
        tracking_since: nextSince,
        low_balance_threshold: threshold,
      },
      { onConflict: 'account_id' },
    )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return toErrorResponse(err)
  }
           }

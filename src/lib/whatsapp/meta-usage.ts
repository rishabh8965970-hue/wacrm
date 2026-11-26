export type MetaUsageState =
  | 'connected'
  | 'disconnected'
  | 'missing_waba'
  | 'unavailable';

export interface MetaPricingDataPoint {
  start: number;
  end: number;
  volume: number;
  cost: number;
  pricingCategory: string;
  pricingType: string;
}

export interface MetaUsageCategoryStat {
  category: string;
  label: string;
  volume: number;
  paidVolume: number;
  freeVolume: number;
  cost: number;
}

export interface MetaUsageDailyPoint {
  date: string;
  label: string;
  volume: number;
  paidVolume: number;
  freeVolume: number;
  cost: number;
}

export interface MetaWalletTrackerState {
  configured: boolean;
  fundedAmount: number;
  spendOffset: number;
  trackingSince: string;
  lowBalanceThreshold: number;
  spendSinceTracking: number;
  estimatedRemaining: number;
  isLowBalance: boolean;
  updatedAt: string | null;
}

export interface MetaUsageResponse {
  state: MetaUsageState;
  days: number;
  wabaId: string | null;
  wabaName: string | null;
  currency: string;
  costAvailable: boolean;
  error?: string;
  totals: {
    volume: number;
    paidVolume: number;
    freeVolume: number;
    cost: number;
  };
  categories: MetaUsageCategoryStat[];
  daily: MetaUsageDailyPoint[];
  wallet: MetaWalletTrackerState;
}

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: 'Marketing',
  MARKETING_LITE: 'Marketing Lite',
  MARKETING_LITE_DYNAMIC: 'Marketing Lite',
  UTILITY: 'Utility',
  AUTHENTICATION: 'Authentication',
  AUTHENTICATION_INTERNATIONAL: 'Authentication (Intl)',
  SERVICE: 'Service (Customer Reply)',
  AI_BOT: 'AI Provider',
};

const CATEGORY_ORDER = [
  'MARKETING',
  'UTILITY',
  'AUTHENTICATION',
  'AUTHENTICATION_INTERNATIONAL',
  'SERVICE',
  'AI_BOT',
];

export function roundMoney(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function normalizePricingCategory(raw?: string | null): string {
  const key = (raw ?? '').trim().toUpperCase();
  if (!key) return 'OTHER';
  if (key === 'MARKETING_LITE' || key === 'MARKETING_LITE_DYNAMIC') {
    return 'MARKETING';
  }
  return key;
}

export function getCategoryLabel(category: string): string {
  const key = category.trim().toUpperCase();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  if (key === 'OTHER') return 'Other';
  return key
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function isFreePricingPoint(point: Pick<MetaPricingDataPoint, 'pricingType' | 'cost'>): boolean {
  const type = (point.pricingType ?? '').trim().toUpperCase();
  if (type === 'FREE_CUSTOMER_SERVICE' || type === 'FREE_ENTRY_POINT') {
    return true;
  }
  if (type === 'REGULAR') {
    return false;
  }
  return Number(point.cost) <= 0;
}

export function toIsoDateUtc(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}

export function aggregatePricingDataPoints(points: MetaPricingDataPoint[]): {
  totals: MetaUsageResponse['totals'];
  categories: MetaUsageCategoryStat[];
  daily: MetaUsageDailyPoint[];
} {
  const categoryMap = new Map<string, MetaUsageCategoryStat>();
  const dailyMap = new Map<string, MetaUsageDailyPoint>();

  let totalVolume = 0;
  let totalPaidVolume = 0;
  let totalFreeVolume = 0;
  let totalCost = 0;

  for (const point of points) {
    const volume = Number(point.volume) || 0;
    const cost = Number(point.cost) || 0;
    const free = isFreePricingPoint(point);
    const paidVol = free ? 0 : volume;
    const freeVol = free ? volume : 0;

    totalVolume += volume;
    totalPaidVolume += paidVol;
    totalFreeVolume += freeVol;
    totalCost += cost;

    const category = normalizePricingCategory(point.pricingCategory);
    const catRow = categoryMap.get(category) ?? {
      category,
      label: getCategoryLabel(category),
      volume: 0,
      paidVolume: 0,
      freeVolume: 0,
      cost: 0,
    };
    catRow.volume += volume;
    catRow.paidVolume += paidVol;
    catRow.freeVolume += freeVol;
    catRow.cost = roundMoney(catRow.cost + cost);
    categoryMap.set(category, catRow);

    const isoDate = toIsoDateUtc(point.start);
    if (isoDate) {
      const dayRow = dailyMap.get(isoDate) ?? {
        date: isoDate,
        label: formatDayLabel(isoDate),
        volume: 0,
        paidVolume: 0,
        freeVolume: 0,
        cost: 0,
      };
      dayRow.volume += volume;
      dayRow.paidVolume += paidVol;
      dayRow.freeVolume += freeVol;
      dayRow.cost = roundMoney(dayRow.cost + cost);
      dailyMap.set(isoDate, dayRow);
    }
  }

  for (const baseCategory of ['MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE']) {
    if (!categoryMap.has(baseCategory)) {
      categoryMap.set(baseCategory, {
        category: baseCategory,
        label: getCategoryLabel(baseCategory),
        volume: 0,
        paidVolume: 0,
        freeVolume: 0,
        cost: 0,
      });
    }
  }

  const categories = Array.from(categoryMap.values()).sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a.category);
    const idxB = CATEGORY_ORDER.indexOf(b.category);
    const rankA = idxA === -1 ? 999 : idxA;
    const rankB = idxB === -1 ? 999 : idxB;
    if (rankA !== rankB) return rankA - rankB;
    return b.volume - a.volume;
  });

  const daily = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return {
    totals: {
      volume: totalVolume,
      paidVolume: totalPaidVolume,
      freeVolume: totalFreeVolume,
      cost: roundMoney(totalCost),
    },
    categories,
    daily,
  };
}

export function calculateWalletEstimate(params: {
  configured: boolean;
  fundedAmount: number;
  spendOffset: number;
  rawSpendSinceTracking: number;
  lowBalanceThreshold: number;
  trackingSince: string;
  updatedAt: string | null;
}): MetaWalletTrackerState {
  const fundedAmount = roundMoney(params.fundedAmount);
  const spendOffset = roundMoney(params.spendOffset);
  const spendSinceTracking = roundMoney(
    Math.max(0, params.rawSpendSinceTracking - spendOffset),
  );
  const estimatedRemaining = roundMoney(fundedAmount - spendSinceTracking);
  const lowBalanceThreshold = roundMoney(params.lowBalanceThreshold);

  return {
    configured: params.configured,
    fundedAmount,
    spendOffset,
    trackingSince: params.trackingSince,
    lowBalanceThreshold,
    spendSinceTracking,
    estimatedRemaining,
    isLowBalance: params.configured && estimatedRemaining <= lowBalanceThreshold,
    updatedAt: params.updatedAt,
  };
}

export function formatMetaMoney(value: number, currency = 'INR'): string {
  const code = (currency || 'INR').trim().toUpperCase();
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
                             }

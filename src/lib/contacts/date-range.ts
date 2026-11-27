export type ContactDatePreset = 'all' | 'today' | 'yesterday' | '7d' | 'custom';

export interface ContactDateRangeFilter {
  preset: Exclude<ContactDatePreset, 'all'>;
  fromDate: string;
  toDate: string;
  fromIso: string;
  toIso: string;
  onlyMetaAds?: boolean;
}

export function formatLocalDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function localDateBoundsToIso(
  fromDate: string,
  toDate: string,
): { fromIso: string; toIso: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return null;
  }
  const [fy, fm, fd] = fromDate.split('-').map(Number);
  const [ty, tm, td] = toDate.split('-').map(Number);
  const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
  const endExclusive = new Date(ty, tm - 1, td + 1, 0, 0, 0, 0);
  if (Number.isNaN(start.getTime()) || Number.isNaN(endExclusive.getTime())) {
    return null;
  }
  if (endExclusive.getTime() <= start.getTime()) {
    return null;
  }
  return {
    fromIso: start.toISOString(),
    toIso: endExclusive.toISOString(),
  };
}

export function buildPresetDateRange(
  preset: Exclude<ContactDatePreset, 'all' | 'custom'>,
): { fromDate: string; toDate: string; fromIso: string; toIso: string } {
  const now = new Date();
  const today = formatLocalDateInput(now);

  if (preset === 'today') {
    const bounds = localDateBoundsToIso(today, today)!;
    return { fromDate: today, toDate: today, ...bounds };
  }

  if (preset === 'yesterday') {
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yStr = formatLocalDateInput(y);
    const bounds = localDateBoundsToIso(yStr, yStr)!;
    return { fromDate: yStr, toDate: yStr, ...bounds };
  }

  // Last 7 days including today
  const start7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const sStr = formatLocalDateInput(start7);
  const bounds = localDateBoundsToIso(sStr, today)!;
  return { fromDate: sStr, toDate: today, ...bounds };
}

export const BROADCAST_PREFILL_STORAGE_KEY = 'wacrm:broadcast-prefill-audience';

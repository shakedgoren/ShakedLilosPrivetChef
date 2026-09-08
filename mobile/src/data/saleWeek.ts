/** ימי מכירה קבועים: שלישי = קוסקוס, שישי = שניצל בחלה. */
export const WEEKDAY_SALE: Record<number, 'cous' | 'schn'> = {
  2: 'cous',
  5: 'schn',
};

/** ISO `YYYY-MM-DD` לפי UTC — בלי הזזת יום מקומית. */
export function weekdaySale(iso: string): 'cous' | 'schn' | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAY_SALE[wd] ?? null;
}

export function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(t.getUTCDate()).padStart(2, '0');
  return `${t.getUTCFullYear()}-${mm}-${dd}`;
}

export function eachIsoDate(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  for (let d = from; d <= to; d = addDaysIso(d, 1)) out.push(d);
  return out;
}

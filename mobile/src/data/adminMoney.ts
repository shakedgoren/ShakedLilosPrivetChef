/**
 * כספים · חולץ מ-AdminMoney.dc.html בקנבס.
 * מגשי הפירות אינם בניהול הכספי. אין פיצול מע״מ · עוסק פטור.
 */

export type MoneyCatShare = { id: string; n: string; hue: string; deep: string; share: number };
export const MONEY_CATS: MoneyCatShare[] = [
  { id: 'cous', n: 'שלישי של קוסקוס', hue: '#7B5CBC', deep: '#43307A', share: 0.43 },
  { id: 'schn', n: 'שישי של מטעמים', hue: '#416D9E', deep: '#2B4A6E', share: 0.3 },
  { id: 'box', n: 'מארזי ספיישל', hue: '#437C59', deep: '#2C5A3E', share: 0.23 },
  { id: 'chef', n: 'שף וטאבון', hue: '#A85A28', deep: '#7A3D18', share: 0.04 },
];

export type PeriodKey = 'month' | 'quart' | 'year';
export type MoneyPeriod = { n: string; label: string; gross: number; factor: number };
export const PERIODS: Record<PeriodKey, MoneyPeriod> = {
  month: { n: 'החודש', label: 'אוגוסט 2026', gross: 40900, factor: 1 },
  quart: { n: 'רבעון', label: 'יוני–אוגוסט 2026', gross: 120000, factor: 2.94 },
  year: { n: 'השנה', label: 'ספטמבר 2025 – אוגוסט 2026', gross: 350000, factor: 8.55 },
};

export type ExpenseSeed = { k: string; sub: string; gross: number };
export const EXPENSES: ExpenseSeed[] = [
  { k: 'חומרי גלם', sub: 'שוק, מחסן וקצביה', gross: 12980 },
  { k: 'אריזות וכלים', sub: 'מארזים, קופסאות וסכו״ם', gross: 3140 },
  { k: 'דלק ומשלוחים', sub: 'נסיעות וחלוקה', gross: 2360 },
  { k: 'ציוד ותחזוקה', sub: 'מטבח וטאבון', gross: 1580 },
  { k: 'שיווק', sub: 'צילום וקידום באינסטגרם', gross: 1180 },
];

export const MONEY_TITLE = 'כספים';
export const REV_LABEL = 'מחזור';
export const REV_SUB_PREFIX = 'רווחיות ';
export const TILE_EXP = 'הוצאות';
export const TILE_PROFIT = 'רווח';
export const CAT_TITLE = 'לפי קטגוריה';
export const EXP_TITLE = 'הוצאות';

/**
 * כספים · הנתונים חולצו אוטומטית מ-AdminMoney.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-money.mjs && node scripts/emit-admin-money.mjs
 *
 * ⚠ אין פיצול מע״מ · שקד עוסקת פטורה, כל הסכומים כפי שנגבו ושולמו.
 * מגשי הפירות אינם בניהול הכספי הזה · לא בהכנסות ולא בהוצאות.
 */

export type MoneyCat = { n: string; hue: string; deep: string; share: number };
export const CATS: MoneyCat[] = [
  {
    "n": "שלישי של קוסקוס",
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "share": 0.43
  },
  {
    "n": "שישי של מטעמים",
    "hue": "#416D9E",
    "deep": "#2B4A6E",
    "share": 0.3
  },
  {
    "n": "מארזי ספיישל",
    "hue": "#437C59",
    "deep": "#2C5A3E",
    "share": 0.23
  },
  {
    "n": "שף וטאבון",
    "hue": "#A85A28",
    "deep": "#7A3D18",
    "share": 0.04
  }
];

export type PeriodKey = 'month' | 'quart' | 'year';
export type Period = { n: string; label: string; gross: number; factor: number };
/** ⚠ מספרי הדגמה · נכתבו על ידי Claude בקנבס. המחזור בלי מגשי הפירות */
export const PERIODS: Record<PeriodKey, Period> = {
  "month": {
    "n": "החודש",
    "label": "אוגוסט 2026",
    "gross": 40900,
    "factor": 1
  },
  "quart": {
    "n": "רבעון",
    "label": "יוני–אוגוסט 2026",
    "gross": 120000,
    "factor": 2.94
  },
  "year": {
    "n": "השנה",
    "label": "ספטמבר 2025 – אוגוסט 2026",
    "gross": 350000,
    "factor": 8.55
  }
};
export const PERIOD_KEYS: PeriodKey[] = [
  "month",
  "quart",
  "year"
];

/** ההוצאות · הסכומים כפי שהם מופיעים בקבלות */
export type Expense = { k: string; sub: string; gross: number };
export const EXPENSES: Expense[] = [
  {
    "k": "חומרי גלם",
    "sub": "שוק, מחסן וקצביה",
    "gross": 12980
  },
  {
    "k": "אריזות וכלים",
    "sub": "מארזים, קופסאות וסכו״ם",
    "gross": 3140
  },
  {
    "k": "דלק ומשלוחים",
    "sub": "נסיעות וחלוקה",
    "gross": 2360
  },
  {
    "k": "ציוד ותחזוקה",
    "sub": "מטבח וטאבון",
    "gross": 1580
  },
  {
    "k": "שיווק",
    "sub": "צילום וקידום באינסטגרם",
    "gross": 1180
  }
];

export const START_PERIOD: PeriodKey = "month";

/* ── כותרות ── */
export const MONEY_TITLE = "כספים";
export const REV_LABEL = "מחזור";
export const MARGIN_PREFIX = "רווחיות ";
export const TILE_KEYS = [
  "הוצאות",
  "רווח"
] as const;
export const CAT_TITLE = "לפי קטגוריה";
export const EXP_TITLE = "הוצאות";

import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-money.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * כספים · הנתונים חולצו אוטומטית מ-AdminMoney.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-money.mjs && node scripts/emit-admin-money.mjs
 *
 * ⚠ אין פיצול מע״מ · שקד עוסקת פטורה, כל הסכומים כפי שנגבו ושולמו.
 * מגשי הפירות אינם בניהול הכספי הזה · לא בהכנסות ולא בהוצאות.
 */

export type MoneyCat = { n: string; hue: string; deep: string; share: number };
export const CATS: MoneyCat[] = ${j(d.CATS)};

export type PeriodKey = 'month' | 'quart' | 'year';
export type Period = { n: string; label: string; gross: number; factor: number };
/** ⚠ מספרי הדגמה · נכתבו על ידי Claude בקנבס. המחזור בלי מגשי הפירות */
export const PERIODS: Record<PeriodKey, Period> = ${j(d.PERIODS)};
export const PERIOD_KEYS: PeriodKey[] = ${j(Object.keys(d.PERIODS))};

/** ההוצאות · הסכומים כפי שהם מופיעים בקבלות */
export type Expense = { k: string; sub: string; gross: number };
export const EXPENSES: Expense[] = ${j(d.EXPENSES)};

export const START_PERIOD: PeriodKey = ${j(d.startPeriod)};

/* ── כותרות ── */
export const MONEY_TITLE = ${j(d.title)};
export const REV_LABEL = ${j(d.revLabel)};
export const MARGIN_PREFIX = ${j(d.marginPrefix)};
export const TILE_KEYS = ${j(d.TILE_KEYS)} as const;
export const CAT_TITLE = ${j(d.catTitle)};
export const EXP_TITLE = ${j(d.expTitle)};
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminMoney.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

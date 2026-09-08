import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-history.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * היסטוריית קניות · הנתונים חולצו אוטומטית מ-AdminHistory.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-history.mjs && node scripts/emit-admin-history.mjs
 */

/** השיוכים · זהים למסך הקניות, בתוספת ״הכל״ בראש */
export type HistoryArea = { id: string; n: string; hue: string; deep: string };
export const AREAS: HistoryArea[] = ${j(d.AREAS)};
export const AREA: Record<string, HistoryArea> = Object.fromEntries(AREAS.map((a) => [a.id, a]));
export const START_FILTER = ${j(d.startFilter)};

/** שורה בקנייה · שם, מחיר ליחידה, כמות ויחידת מידה */
export type BuyRow = { n: string; p: number; q: number; u: string };
export type Buy = { area: string; d: string; t: string; rows: BuyRow[] };

/**
 * ⚠ היסטוריית הדגמה · נכתבה על ידי Claude בקנבס.
 * כל קנייה נשמרת עם השיוך, התאריך והשעה שבהם נסגרה.
 */
export const BUYS: Buy[] = ${j(d.BUYS)};

/** סה״כ הקנייה · סכום המכפלות של כל השורות */
export const buySum = (b: Buy) => b.rows.reduce((s, r) => s + r.p * r.q, 0);

/* ── כותרות ── */
export const HISTORY_TITLE = ${j(d.title)};
export const SUB_MIDDLE = ${j(d.subMiddle)};
export const SUB_SUFFIX = ${j(d.subSuffix)};
export const COLS = {
  name: ${j(d.colName)},
  price: ${j(d.colPrice)},
  qty: ${j(d.colQty)},
  sum: ${j(d.colSum)},
} as const;
export const TOTAL_LABEL = ${j(d.totalLabel)};
export const EMPTY_LABEL = ${j(d.emptyLabel)};
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminHistory.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

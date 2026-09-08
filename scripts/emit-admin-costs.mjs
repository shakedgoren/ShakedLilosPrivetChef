import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-costs.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * עלויות ייצור · הנתונים חולצו אוטומטית מ-AdminCosts.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-costs.mjs && node scripts/emit-admin-costs.mjs
 *
 * ⚠ המחיר שנקבע כאן הוא המחיר של כל האפליקציה, כולל צד הלקוחה.
 * מגשי הפירות אינם כאן — הם לא בניהול הכספי של שקד.
 */

export type CostCatKey = 'cous' | 'schn' | 'box' | 'chef';
export type SubCat = { id: string; n: string };
export type CostCat = {
  id: CostCatKey;
  n: string;
  hue: string;
  deep: string;
  rgb: string;
  subs: SubCat[] | null;
};
export const CATS: CostCat[] = ${j(d.CATS)};

/** פנקס המצרכים · אותו פנקס של מסך הקניות */
export type PantryRow = { name: string; unit: string; price: number };
export const PANTRY: PantryRow[] = ${j(d.PANTRY)};

/**
 * מצבי חישוב:
 *   unit   · עלות ליחידה   = סה״כ המצרכים ÷ כמה יצא
 *   weight · עלות ל-100 גרם = סה״כ המצרכים ÷ (גרמים ÷ 100)
 *   auto   · העלות נשאבת ממנות אחרות · אין מה למלא חוץ מהמחיר
 */
export type CostMode = 'unit' | 'weight' | 'auto';

export type Part = { n: string; price: number; qty: number };
/** מקור שאיבה · id של מנה אחרת, או 'salads:avg' לממוצע הסלטים */
export type FromRef = { id: string; m: number };

export type Dish = {
  id: string;
  c: CostCatKey;
  sub?: string;
  name: string;
  mode: CostMode;
  price: number;
  yld?: number;
  note?: string;
  from?: FromRef[];
  parts?: Part[];
};
/**
 * ⚠ נתוני הדגמה · המצרכים והכמויות נכתבו על ידי Claude בקנבס.
 * המחירים למכירה נלקחו מהמסכים של הלקוחה.
 */
export const DISHES: Dish[] = ${j(d.DISHES)};

/**
 * ⚠ הקניות · אותה רשימה שמופיעה במסך היסטוריית הקניות.
 * הייבוא מושך מכאן את המחיר ששולם בפועל ומעדכן בו כל מצרך תואם.
 */
export type BuyRow = { n: string; p: number; q: number };
export type Buy = { area: string; d: string; t: string; rows: BuyRow[] };
export const BUYS: Buy[] = ${j(d.BUYS)};

/** ⚠ תאריך ההדגמה · ב-1 בחודש התזכורת נדלקת מעצמה */
export const TODAY = ${j(d.TODAY)};
export const MONTHS: string[] = ${j(d.MONTHS)};

/** מתחת לאחוז הזה הרווחיות נחשבת דקה */
export const THIN_MARGIN = ${d.THIN_MARGIN};
/** עומק השאיבה המרבי · מגן מפני מעגל בין מנות */
export const MAX_DEPTH = ${d.MAX_DEPTH};
/** המפתח המיוחד שמושך את ממוצע הסלטים */
export const SALADS_AVG = 'salads:avg';
export const SALADS_AVG_LABEL = ${j(d.saladAvgLabel)};

export const START_CAT: CostCatKey = ${j(d.startCat)};
export const START_SUB = ${j(d.startSub)};

/* ── כותרות ── */
export const COSTS_TITLE = ${j(d.title)};
export const SUB_PREFIX = ${j(d.subPrefix)};
export const DUE_TITLE = ${j(d.dueTitle)};
export const DUE_SUB = ${j(d.dueSub)};
export const IMPORT = {
  label: ${j(d.impLabel)},
  title: ${j(d.impTitle)},
  sub: ${j(d.impSub)},
  none: ${j(d.impNone)},
  prefix: ${j(d.impPrefix)},
  suffix: ${j(d.impSuffix)},
} as const;
export const AUTO_TAG = ${j(d.autoTag)};
export const FROM_LABEL = ${j(d.fromLabel)};
export const PART_PLACEHOLDER = ${j(d.partPh)};
export const COLS = {
  name: ${j(d.colName)},
  price: ${j(d.colPrice)},
  qty: ${j(d.colQty)},
  sum: ${j(d.colSum)},
} as const;
export const PARTS_TITLE = ${j(d.partsTitle)};
export const YIELD_LABEL = ${j(d.yieldLabel)};
export const PRICE_LABEL = ${j(d.priceLabel)};
export const ROW_KEYS = ${j(d.ROW_KEYS)};
export const SCREEN_NOTE = ${j(d.note)};
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminCosts.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

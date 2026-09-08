import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-stock.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * מלאי · הנתונים חולצו אוטומטית מ-AdminStock.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-stock.mjs && node scripts/emit-admin-stock.mjs
 *
 * שתי טבלאות נפרדות · אסור לערבב:
 *   מלאי מכירה   · נקבע בפתיחת יום המכירה ויורד עם כל הזמנה. לקריאה בלבד כאן.
 *   מלאי לוגיסטי · אריזות, יבשים וציוד. מתעדכן ידנית ואינו קשור למכירות.
 */

export type SaleItem = { name: string; quota: number; sold: number };
export type SaleDay = {
  cat: string;
  name: string;
  day: string;
  hue: string;
  deep: string;
  rgb: string;
  open: boolean;
  items: SaleItem[];
};

/** ⚠ נתוני הדגמה · נכתבו על ידי Claude בקנבס. המכסות תואמות את ימי המכירה */
export const SALE_DAYS: SaleDay[] = ${j(d.SALE_DAYS)};
/** המסך מציג רק את הימים שפתוחים כרגע ב-AdminDays */
export const OPEN_DAYS: SaleDay[] = SALE_DAYS.filter((d) => d.open);

export type SupplyItem = {
  g: string;
  name: string;
  n: number;
  unit: string;
  min: number;
  /** כמה יחידות באריזה · רק לפריטים שנקנים בחבילה או בקרטון */
  per?: number;
};
export const SUPPLY: SupplyItem[] = ${j(d.SUPPLY)};
export const SUP_GROUPS: string[] = ${j(d.SUP_GROUPS)};
export const SUP_UNITS: string[] = ${j(d.SUP_UNITS)};
/** באריזה שלמה שואלים גם כמה יחידות יש בתוכה */
export const PACKED: string[] = ${j(d.PACKED)};

export const STOCK_TABS: { id: 'sale' | 'supply'; name: string }[] = ${j(d.TABS)};

/** מתחת לכמה מנות נחשב ״כמעט אזל״ */
export const LOW_LEFT = ${d.LOW_LEFT};
export const STATE_LABELS = ${j(d.STATE_LABELS)} as const;

/* ── כותרות ── */
export const STOCK_TITLE = ${j(d.title)};
export const STOCK_SUB = ${j(d.sub)};
export const DAY_TAG_ONE = ${j(d.dayTagOne)};
export const DAY_TAG_MANY = ${j(d.dayTagMany)};
export const NO_OPEN_DAY = ${j(d.noOpenDay)};
export const ROW_LEFT_TAG = ${j(d.rowLeftTag)};
export const TOTAL_LEFT_TAG = ${j(d.totalLeftTag)};
export const NO_DAY_LABEL = ${j(d.noDayLabel)};
export const NO_DAY_SUB = ${j(d.noDaySub)};
export const DROP_LABEL = ${j(d.dropLabel)};
export const SALE_NOTE = ${j(d.saleNote)};
export const LOW_CTA = ${j(d.lowCta)};
export const SUPPLY_NOTE = ${j(d.supplyNote)};

/* ── חלונית ההוספה ── */
export const ADD = {
  title: ${j(d.addTitle)},
  sub: ${j(d.addSub)},
  nameLabel: ${j(d.nameLabel)},
  namePlaceholder: ${j(d.namePh)},
  groupLabel: ${j(d.groupLabel)},
  unitLabel: ${j(d.unitLabel)},
  qtyLabel: ${j(d.qtyLabel)},
  minLabel: ${j(d.minLabel)},
  cta: ${j(d.addCta)},
} as const;
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminStock.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-shopping.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * רשימת קניות · הנתונים חולצו אוטומטית מ-AdminShopping.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-shopping.mjs && node scripts/emit-admin-shopping.mjs
 */

export const GROUPS: string[] = ${j(d.GROUPS)};
export const UNITS: string[] = ${j(d.UNITS)};

/** לכל קנייה יש שיוך · הוא נכנס לשם הקנייה ולהיסטוריה */
export type Area = { id: string; n: string; hue: string; deep: string };
export const AREAS: Area[] = ${j(d.AREAS)};
export const AREA: Record<string, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a]));
export const START_AREA = ${j(d.startArea)};

export type PantryItem = { name: string; g: string; unit: string; price: number };
/**
 * ⚠ פנקס המצרכים · נבנה מהקניות הקודמות. מה שנקנה פעם אחת
 * חוזר כאן עם הקבוצה, היחידה והמחיר האחרון ששולם עליו.
 */
export const PANTRY: PantryItem[] = ${j(d.PANTRY)};

export type ShopItem = {
  g: string;
  name: string;
  unit: string;
  qty: string;
  price: string;
  done: boolean;
  /** מה שולם בפועל · מגיע מהקנייה, אין לו עריכה במסך */
  actual: string;
};
/** ⚠ רשימת הדגמה · נכתבה על ידי Claude בקנבס */
export const SEED: ShopItem[] = ${j(d.SEED)};

/** שמות החודשים בצורת ״ב-״ · לשם הקנייה */
export const MONTHS: string[] = ${j(d.MONTHS)};

export const DEFAULT_GROUP = ${j(d.defaultGroup)};
export const DEFAULT_UNIT = ${j(d.defaultUnit)};

/* ── כותרות ── */
export const PROG_LABEL = ${j(d.progLabel)};
export const EST_TAG = ${j(d.estTag)};
export const ACT_TAG = ${j(d.actTag)};
export const COLS = {
  name: ${j(d.colName)},
  price: ${j(d.colPrice)},
  qty: ${j(d.colQty)},
  sum: ${j(d.colSum)},
} as const;
export const EMPTY_LABEL = ${j(d.emptyLabel)};
export const EMPTY_SUB = ${j(d.emptySub)};
export const CLOSE_LABEL = ${j(d.closeLabel)};
export const CLOSE_SUB_PREFIX = ${j(d.closeSubPrefix)};
export const CLOSE_SUB_SUFFIX = ${j(d.closeSubSuffix)};
export const CLOSE_SUB_NONE = ${j(d.closeSubNone)};

/* ── חלונית ההוספה ── */
export const ADD = {
  title: ${j(d.addTitle)},
  nameLabel: ${j(d.nameLabel)},
  namePlaceholder: ${j(d.namePh)},
  groupLabel: ${j(d.groupLabel)},
  unitLabel: ${j(d.unitLabel)},
  qtyLabel: ${j(d.qtyLabel)},
  totalLabel: ${j(d.totalLabel)},
  cta: ${j(d.addCta)},
} as const;
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminShopping.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

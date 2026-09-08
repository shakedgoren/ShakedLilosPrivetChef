import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-menu.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * תפריט · הנתונים חולצו אוטומטית מ-AdminMenu.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-menu.mjs && node scripts/emit-admin-menu.mjs
 *
 * ⚠ המסך לקריאה בלבד. המחיר והעלות מגיעים ממסך עלויות הייצור,
 * ושם גם מעדכנים אותם פעם בחודש. כאן רק רואים מה יוצא מזה.
 */

export type MenuCatKey = 'cous' | 'schn' | 'box' | 'chef';
export type MenuCat = { id: MenuCatKey; n: string; hue: string; deep: string; rgb: string };

/** מגשי הפירות אינם כאן · הם לא בניהול הכספי של שקד */
export const CATS: MenuCat[] = ${j(d.CATS)};

export type MenuRow = { c: MenuCatKey; name: string; price: number; cost: number };
export const MENU: MenuRow[] = ${j(d.MENU)};

/** מתחת לאחוז הזה הרווחיות נחשבת דקה ונצבעת בענבר */
export const THIN_MARGIN = ${d.THIN_MARGIN};

export const START_CAT: MenuCatKey = ${j(d.startCat)};

/* ── כותרות ── */
export const MENU_TITLE = ${j(d.title)};
export const MENU_SUB = ${j(d.sub)};
export const PRICE_LABEL = ${j(d.priceLabel)};
export const COST_LABEL = ${j(d.costLabel)};
export const PROFIT_LABEL = ${j(d.profitLabel)};
export const MARGIN_PREFIX = ${j(d.marginPrefix)};
export const KPI_KEYS = ${j(d.KPI_KEYS)} as const;

/** אחוז הרווחיות של פריט · מעוגל, כמו בקנבס */
export const marginPct = (x: { price: number; cost: number }) =>
  x.price > 0 ? Math.round(((x.price - x.cost) / x.price) * 100) : 0;
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminMenu.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

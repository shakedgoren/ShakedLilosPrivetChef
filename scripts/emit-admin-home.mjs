import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-home.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * בית הניהול · הנתונים חולצו אוטומטית מ-Admin.dc.html בקנבס.
 * חלק מהמספרים ישבו במרקאפ של הגרפים ולא ב-JS, ולכן החולץ מושך גם משם
 * ובודק שכל ערך נמצא בדיוק פעם אחת.
 * לעדכון: node scripts/extract-admin-home.mjs && node scripts/emit-admin-home.mjs
 */

/** מפתחות האריחים · כל אחד מצביע על מסך ניהול אמיתי */
export type TileKey =
  | 'orders' | 'days' | 'stock' | 'shop' | 'people' | 'menu' | 'costs' | 'hist';

export type Tile = { key: TileKey; name: string; file: string; paths: string[] };
export const TILES: Tile[] = ${j(d.TILES)};

/** מספרי הדגמה · נכתבו על ידי Claude בקנבס ותואמים את מסכי הניהול */
export const STATE = ${j(d.STATE)} as const;

export type Quota = {
  key: string;
  name: string;
  hue: string;
  rgb: string;
  sold: number;
  quota: number;
  open: boolean;
};
/** מוצגות רק הקטגוריות של ימי המכירה הפתוחים כרגע */
export const QUOTAS: Quota[] = ${j(d.QUOTAS)};
/** המכסה זזה ביחידה אחת בכל לחיצה */
export const QUOTA_STEP = ${d.QUOTA_STEP};

export type BadgeTone = { bg: string; fg: string };
export const AMBER: BadgeTone = ${j(d.AMBER)};
export const PLUM: BadgeTone = ${j(d.PLUM)};

/* ── כותרות ── */
export const HOME_TITLE = ${j(d.title)};
export const HOME_SUBTITLE = ${j(d.subtitle)};
export const MONTH_CHIP = ${j(d.monthChip)};
export const MANUAL_TITLE = ${j(d.manualTitle)};
export const MANUAL_SUB = ${j(d.manualSub)};

/* ── שני הכרטיסים הקטנים ── */
export const TODAY = {
  ordersLabel: ${j(d.todayOrdersLabel)},
  orders: ${d.todayOrders},
  revenueLabel: ${j(d.todayRevenueLabel)},
  revenue: ${d.todayRevenue},
} as const;

/* ── גרף המחזור · ששת החודשים האחרונים · מערכת קואורדינטות 322×110 ── */
export const REVENUE = {
  title: ${j(d.revenueTitle)},
  total: ${d.revenueTotal},
  line: ${j(d.revenueLine)},
  area: ${j(d.revenueArea)},
  dots: ${j(d.revenueDots)},
  axis: ${j(d.revenueAxis)},
  tip: ${j(d.revenueTip)},
  months: ${j(d.revenueMonths)},
} as const;

/* ── דונאט הקטגוריות · מערכת קואורדינטות 74×74, רדיוס 29 ── */
export const DONUT = {
  title: ${j(d.donutTitle)},
  center: ${j(d.donutCenter)},
  arcs: ${j(d.donutArcs)},
  legend: ${j(d.donutLegend)},
} as const;

/* ── כרטיס הרווח · העמודות במערכת קואורדינטות 148×30 ── */
export const PROFIT = {
  title: ${j(d.profitTitle)},
  net: ${d.profitNet},
  netNote: ${j(d.profitNetNote)},
  grossLabel: ${j(d.profitGrossLabel)},
  gross: ${d.profitGross},
  bars: ${j(d.profitBars)},
} as const;
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminHome.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

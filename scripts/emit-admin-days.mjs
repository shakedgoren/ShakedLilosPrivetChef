import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-days.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * ימי מכירה · הנתונים חולצו אוטומטית מ-AdminDays.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-days.mjs && node scripts/emit-admin-days.mjs
 */

export const MONTHS: string[] = ${j(d.MONTHS)};
/** ראשי התיבות של ימות השבוע · לכותרת רשת הלוח */
export const DOWS: string[] = ${j(d.DOWS)};
export const DAY_NAMES: string[] = ${j(d.DAYNAM)};

export type DayCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';

export type Dish = { id: string; n: string; q: number };
export type DayCat = {
  n: string;
  short: string;
  hue: string;
  deep: string;
  rgb: string;
  dishes: Dish[];
};

/** חמש הקטגוריות · אותם גוונים של כל האפליקציה */
export const CATS: Record<DayCatKey, DayCat> = ${j(d.CATS)};
export const CAT_KEYS: DayCatKey[] = ${j(d.CAT_KEYS)};
/** רק שתי אלה נקבעות כיום מכירה · השאר זמינות רק כחריגה */
export const SALE_KEYS: DayCatKey[] = ${j(d.SALE_KEYS)};

export type DayRecord = {
  /** הקטגוריה של יום המכירה */
  sale?: DayCatKey | null;
  /** נפתח להזמנות ללקוחות */
  open?: boolean;
  /** היום חסום לכל הקטגוריות */
  blocked?: boolean;
  /** קטגוריה אחת שנפתחה בכל זאת ביום חסום */
  except?: DayCatKey | null;
  /** מכסה לכל מנה */
  q?: Record<string, number>;
  /** מה כבר נמכר · לקריאה בלבד, מגיע מההזמנות */
  sold?: Record<string, number>;
};

/**
 * ⚠ מצב פתיחה · התאריכים החסומים הועתקו מהשאלון הישן ולא אושרו.
 * כאן הם רק מצב התחלתי — שקד פותחת וסוגרת ימים מהמסך הזה.
 */
export const SEED: Record<string, DayRecord> = ${j(d.SEED)};

/* ── כותרות ── */
export const DAYS_TITLE = ${j(d.title)};
export const DAYS_SUB = ${j(d.sub)};
export const SALE_TITLE = ${j(d.saleTitle)};
export const EXCEPT_TITLE = ${j(d.exceptTitle)};
export const EXCEPT_SUB = ${j(d.exceptSub)};
export const TOTAL_LABEL = ${j(d.totalLabel)};

export const LEGEND: { text: string; color: string }[] = ${j(d.legend)};

/** החודש שהמסך נפתח בו בקנבס · ספטמבר 2026, והיום הנבחר הוא ה-8 */
export const START_YEAR = 2026;
export const START_MONTH = 8;
export const START_DAY = 8;
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminDays.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

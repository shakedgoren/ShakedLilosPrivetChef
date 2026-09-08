import fs from 'fs';

const d = JSON.parse(fs.readFileSync('/private/tmp/claude-501/-Users-shakedgoren-Downloads-files/51bba7d1-c035-48ce-ad36-342e2d8c1dcf/scratchpad/admin-orders.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * ניהול הזמנות · הנתונים חולצו אוטומטית מ-AdminOrders.dc.html בקנבס,
 * כדי שכל טקסט, מחיר וגוון יהיו זהים בדיוק למה שבעיצוב.
 * לעדכון: node scripts/extract-admin-orders.mjs && node scripts/emit-admin-orders.mjs
 */

export type AdminCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';

export type Hue = { n: string; hue: string; deep: string; rgb: string };
export const HUES: Record<AdminCatKey, Hue> = ${j(d.HUES)};

/** בהזמנה ידנית פתוחות רק שתי הקטגוריות שנמכרות בימי מכירה */
export const MANUAL_CATS: AdminCatKey[] = ${j(d.MANUAL_CATS)};

export type BookEntry = { name: string; phone: string; addr: string };
/** פנקס לקוחות להדגמה · תואם את מסך הלקוחות */
export const BOOK: BookEntry[] = ${j(d.BOOK)};

export type MenuItem = { id: string; n: string; s?: string; price: number };
export const MENU: Partial<Record<AdminCatKey, MenuItem[]>> = ${j(d.MENU)};

export type SchRoll = { type: string; n: string; s: string; price: number; tops: string[] };
export const SCH_ROLLS: SchRoll[] = ${j(d.SCH_ROLLS)};

/** אותה חלה לפי מפתח הסוג · נגזר מ-SCH_ROLLS, לא כפול */
export const ROLL: Record<string, SchRoll> = Object.fromEntries(
  SCH_ROLLS.map((r) => [r.type, r]),
);

export const SHIP_FEE: Record<string, number> = ${j(d.SHIP_FEE)};
export const DELIV_MIN_MEALS = ${d.DELIV_MIN_MEALS};

/** מסלול המצבים · כל הזמנה מתקדמת בסדר הזה */
export const FLOW: string[] = ${j(d.FLOW)};
/** ״בוטלה״ אינו חלק מהמסלול · אפשר להגיע אליו מכל מצב שטרם נמסר */
export const CANCELLED = ${j(d.CANCELLED)};

export const TONE: Record<string, { bg: string; fg: string }> = ${j(d.TONE)};

/** ביטול מאוחר · פחות מ-12 שעות לפני האיסוף מחייב 30% מהעסקה */
export const LATE_HOURS = ${d.LATE_HOURS};
export const LATE_FEE = ${d.LATE_FEE};
export const REASONS: string[] = ${j(d.REASONS)};

export type AdminOrder = {
  key: AdminCatKey;
  status: string;
  who: string;
  phone: string;
  time: string;
  items: string;
  sum: number;
  ship: string;
  pay: string;
  via: string;
  /** שעות שנותרו עד האיסוף · שלילי אם עבר */
  hrs: number;
};

/** הזמנות הדגמה · נכתבו על ידי Claude בקנבס */
export const ORDERS: AdminOrder[] = ${j(d.ORDERS)};

/** תאריך יום המכירה שמוצג תחת הכותרת */
export const ORDERS_SUBTITLE = 'שלישי · 25 באוגוסט';
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminOrders.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

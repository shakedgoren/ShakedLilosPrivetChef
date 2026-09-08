import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/my-orders.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * ההזמנות שלי · הנתונים חולצו אוטומטית מ-MyOrders.dc.html בקנבס.
 * לעדכון: node scripts/extract-my-orders.mjs && node scripts/emit-my-orders.mjs
 */

export type OrderCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';
export type Hue = { hue: string; deep: string; rgb: string };
export const HUES: Record<OrderCatKey, Hue> = ${j(d.HUES)};

export type MyOrder = {
  key: OrderCatKey;
  /** ההזמנה שעוד בתהליך · מוצגת בראש ובנפרד */
  live: boolean;
  status: string;
  name: string;
  items: string;
  sum: number;
  when: string;
  pay: string;
  ref: string;
  cancelled?: boolean;
  /** דמי הביטול שנגבו · רק בהזמנה שבוטלה */
  fee?: number;
};
/** ⚠ when / pay / ref בהזמנות שהסתיימו הם ערכי הדגמה שנכתבו על ידי Claude */
export const ORDERS: MyOrder[] = ${j(d.ORDERS)};

/* ── כותרות ── */
export const MY_ORDERS_TITLE = ${j(d.title)};
export const PAST_LABEL = ${j(d.pastLabel)};
export const EMPTY_TEXT = ${j(d.emptyText)};
export const EMPTY_CTA = ${j(d.emptyCta)};
export const AGAIN_LABEL = ${j(d.againLabel)};
export const ROW_KEYS = ${j(d.ROW_KEYS)} as const;
export const FEE_KEY = ${j(d.feeKey)};
export const COUNT = {
  live: ${j(d.countLive)},
  past: ${j(d.countPast)},
  onlyPast: ${j(d.countOnlyPast)},
} as const;
export const SIGN_OUT = {
  title: ${j(d.outTitle)},
  body: ${j(d.outBody)},
  cancel: ${j(d.outCancel)},
  confirm: ${j(d.outConfirm)},
} as const;
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/myOrders.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');

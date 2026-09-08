/**
 * ההזמנות שלי · הנתונים חולצו אוטומטית מ-MyOrders.dc.html בקנבס.
 * לעדכון: node scripts/extract-my-orders.mjs && node scripts/emit-my-orders.mjs
 */

export type OrderCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';
export type Hue = { hue: string; deep: string; rgb: string };
export const HUES: Record<OrderCatKey, Hue> = {
  "cous": {
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "rgb": "123,92,188"
  },
  "schn": {
    "hue": "#416D9E",
    "deep": "#2B4A6E",
    "rgb": "65,109,158"
  },
  "box": {
    "hue": "#437C59",
    "deep": "#2C5A3E",
    "rgb": "67,124,89"
  },
  "fruit": {
    "hue": "#B04A76",
    "deep": "#7A2E4E",
    "rgb": "176,74,118"
  },
  "chef": {
    "hue": "#A85A28",
    "deep": "#7A3D18",
    "rgb": "168,90,40"
  }
};

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
export const ORDERS: MyOrder[] = [
  {
    "key": "cous",
    "live": true,
    "status": "בהכנה",
    "name": "שלישי של קוסקוס",
    "items": "2 × צמחוני · 1 × עם 2 יח׳ מפרום",
    "sum": 145,
    "when": "איסוף היום · 12:30",
    "pay": "ביט",
    "ref": "2508-1471"
  },
  {
    "key": "schn",
    "live": false,
    "status": "נאסף · 15.8",
    "name": "שישניצל",
    "items": "2 חלות · שניצל דק",
    "sum": 110,
    "when": "איסוף · 15.8, 11:40",
    "pay": "ביט",
    "ref": "1508-1362"
  },
  {
    "key": "cous",
    "live": false,
    "status": "נאסף · 11.8",
    "name": "שלישי של קוסקוס",
    "items": "3 × עם ירך עוף מתוק",
    "sum": 165,
    "when": "איסוף · 11.8, 13:10",
    "pay": "אפל פיי",
    "ref": "1108-1289"
  },
  {
    "key": "fruit",
    "live": false,
    "status": "בוטלה · 22.8",
    "name": "מגשי פירות",
    "cancelled": true,
    "items": "מגש בינוני",
    "sum": 300,
    "fee": 90,
    "when": "איסוף · 22.8, 10:00",
    "pay": "ביט",
    "ref": "2208-1401"
  }
];

/* ── כותרות ── */
export const MY_ORDERS_TITLE = "ההזמנות שלי";
export const PAST_LABEL = "הזמנות קודמות";
export const EMPTY_TEXT = "עוד לא הוזמנה התמכרות חדשה 😝";
export const EMPTY_CTA = "מה יש היום";
export const AGAIN_LABEL = "להזמין שוב";
export const ROW_KEYS = [
  "הפריטים",
  "מועד",
  "תשלום",
  "מספר הזמנה"
] as const;
export const FEE_KEY = "דמי ביטול";
export const COUNT = {
  live: " פעילה · ",
  past: " קודמות",
  onlyPast: " הזמנות קודמות",
} as const;
export const SIGN_OUT = {
  title: "להתנתק מהחשבון?",
  body: "ההזמנות והפרטים שלך יישמרו. תוכלי להיכנס שוב מתי שתרצי.",
  cancel: "ביטול",
  confirm: "התנתקות",
} as const;

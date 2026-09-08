import { buildSlots } from '../order/types';

/**
 * מגשי פירות · הנתונים חולצו אוטומטית מ-Fruit.dc.html בקנבס.
 * לעדכון: node scripts/extract-fruit.mjs && node scripts/emit-fruit.mjs
 *
 * כל מגשי הפירות נעשים על ידי מיכל גורן.
 */

export type Tray = {
  name: string;
  price: number;
  /** התיאור · מה שלפני הנקודה המפרידה */
  desc: string;
  /** כמות הסועדים · מה שאחריה, בשורה נפרדת בכרטיס */
  serves: string;
};

const RAW = [
  {
    "name": "מגש מרובע גדול",
    "price": 300,
    "desc": "הבחירה הקלאסית לאירוח משפחתי • מתאים לכ־ 10–8 סועדים."
  },
  {
    "name": "מגש מלבני גדול",
    "price": 300,
    "desc": "נוכחות אלגנטית שמתאימה לכל אירוח • מתאים לכ־ 10–8 סועדים."
  },
  {
    "name": "מגש עגול ענק",
    "price": 400,
    "desc": "שפע שנועד לחלוק עם כולם • מתאים לכ־ 12-15 סועדים."
  },
  {
    "name": "מגש סירה מפואר",
    "price": 450,
    "desc": "מרכז שולחן שלא צריך שום קישוט לידו • מתאים לכ־ 15–12 סועדים."
  }
];

/** התיאור וכמות הסועדים מוצגים בשתי שורות · הקנבס מפצל על ״ • ״ */
export const FRUIT_TRAYS: Tray[] = RAW.map((it) => {
  const [desc, serves = ''] = it.desc.split(' • ');
  return { name: it.name, price: it.price, desc, serves };
});

/* ── טקסטים ── */
export const FRUIT_TITLE = "מגשי פירות";
export const FRUIT_HOURS = "א׳–ה׳ 7:00–20:00 · שישי וערבי חג 7:00–14:00";
export const BY_APPOINTMENT = "בתיאום והזמנה מראש בלבד.";
export const INTRO_TITLE = "כשטריות פוגשת אמנות 🍓";
export const INTRO_BODY = "כל מגש נוצר בעבודת יד ובאהבה על ידי מיכל גורן, עם פירות מובחרים, טריים וצבעוניים שנבחרים בקפידה ומסודרים באסתטיקה מושלמת.\nחגיגה של צבע, טריות וטעם שהופכת כל שולחן לבלתי נשכח.";
export const DISCLAIMER = "העיצוב בתמונה להמחשה • כל מגש נבנה באופן ייחודי לפי פירות העונה.";
export const PHONE_LABEL = "לפרטים נוספים: 052-2958511";
export const PHONE_HREF = "tel:0522958511";

/* ── מידות הכרטיס · מהקנבס ── */
export const CARD = {
  radius: 20,
  padding: 9,
  /** הרווח בין שורות בתוך הכרטיס */
  inner: 7,
  shotHeight: 118,
  shotRadius: 15,
  gap: 10,
} as const;

const PICKUP_FROM = 420;
const PICKUP_TO = 1200;
const DELIVERY_STEP_MINUTES = 30;

export const FRUIT_FULFILLMENT = {
  pickupFrom: PICKUP_FROM,
  pickupTo: PICKUP_TO,
  deliverySlots: buildSlots(420, 1200, DELIVERY_STEP_MINUTES),
} as const;

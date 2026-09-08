import { buildSlots } from '../order/types';

/**
 * מגשי פירות · הנתונים הועתקו אחד לאחד מ-Fruit.dc.html.
 * מחירים, שמות ותיאורים הם תוכן של שקד — אין לשנות אותם כאן.
 */

export type Tray = { name: string; price: number; desc: string };

export const FRUIT_TRAYS: Tray[] = [
  {
    name: 'מגש מרובע גדול',
    price: 300,
    desc: 'הבחירה הקלאסית לאירוח משפחתי • מתאים לכ־ 10–8 סועדים.',
  },
  {
    name: 'מגש מלבני גדול',
    price: 300,
    desc: 'נוכחות אלגנטית שמתאימה לכל אירוח • מתאים לכ־ 10–8 סועדים.',
  },
  {
    name: 'מגש עגול ענק',
    price: 400,
    desc: 'שפע שנועד לחלוק עם כולם • מתאים לכ־ 12-15 סועדים.',
  },
  {
    name: 'מגש סירה מפואר',
    price: 450,
    desc: 'מרכז שולחן שלא צריך שום קישוט לידו • מתאים לכ־ 15–12 סועדים.',
  },
];

/* מגשי פירות זמינים לאורך כל היום · 7:00–20:00 */
const OPEN_FROM = 7 * 60;
const OPEN_TO = 20 * 60;
const DELIVERY_STEP_MINUTES = 30;

export const FRUIT_FULFILLMENT = {
  pickupFrom: OPEN_FROM,
  pickupTo: OPEN_TO,
  deliverySlots: buildSlots(OPEN_FROM, OPEN_TO, DELIVERY_STEP_MINUTES),
  clockFallback: '09:00',
} as const;

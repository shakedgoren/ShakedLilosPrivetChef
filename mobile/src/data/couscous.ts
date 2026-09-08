import { buildSlots } from '../order/types';

/**
 * שלישי של קוסקוס · הנתונים הועתקו אחד לאחד מ-Order.dc.html בקנבס.
 * מחירים ושמות מנות הם תוכן של שקד — אין לשנות אותם כאן.
 */

export type MenuItem = { name: string; price: number; meal: boolean };

export const COUSCOUS_MENU: MenuItem[] = [
  { name: 'קוסקוס צמחוני', price: 45, meal: true },
  { name: 'קוסקוס עם עוף', price: 55, meal: true },
  { name: 'קוסקוס עם מפרום', price: 65, meal: true },
  { name: 'תוספת ירקות', price: 10, meal: false },
  { name: 'תוספת עוף', price: 15, meal: false },
  { name: 'תוספת מפרום', price: 20, meal: false },
];

const PICKUP_FROM = 11 * 60 + 30;
const PICKUP_TO = 14 * 60 + 30;
const DELIVERY_STEP_MINUTES = 20;

/** מתחת לכמות הזאת של מנות אין משלוח, רק איסוף עצמי */
export const DELIVERY_MIN_MEALS = 4;

export const COUSCOUS_FULFILLMENT = {
  pickupFrom: PICKUP_FROM,
  pickupTo: PICKUP_TO,
  deliverySlots: buildSlots(12 * 60, 14 * 60, DELIVERY_STEP_MINUTES),
  minMealsForDelivery: DELIVERY_MIN_MEALS,
} as const;

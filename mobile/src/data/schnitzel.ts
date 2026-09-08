import { buildSlots } from '../order/types';

/**
 * שישי של מטעמים · הנתונים הועתקו אחד לאחד מ-Schnitzel.dc.html.
 * מחירים, שמות ותוספות הם תוכן של שקד — אין לשנות אותם כאן.
 */

export type SchnitzelType = {
  name: string;
  short: string;
  /** מחיר חלה אחת */
  unit: number;
  /** מחיר מארז */
  box: number;
  tops: string[];
};

export const SCHNITZEL_TYPES: SchnitzelType[] = [
  {
    name: 'שניצל דק בציפוי פירורי לחם',
    short: 'שניצל דק',
    unit: 50,
    box: 200,
    tops: ['מטבוחה', 'טחינה', 'חציל בטמפורה', 'כרוב סגול', 'פלפל חריף'],
  },
  {
    name: 'פילה עוף בציפוי טמפורה',
    short: 'פילה עוף',
    unit: 60,
    box: 250,
    tops: ['איולי עמבה', 'איולי עשבי תיבול', 'עלי רוקט', 'מלפפון חמוץ'],
  },
];

/** שתי דרכי ההזמנה · חלות בודדות או מארז */
export const SCHNITZEL_MODES = ['לפי יחידה', 'מארז'] as const;

/** רטבים בקוקוט לצד ההזמנה */
export const COCOTTES = ['איולי עמבה', 'איולי כוסברה', 'טחינה'];
export const COCOTTE_PRICE = 3;

const PICKUP_FROM = 11 * 60;
const PICKUP_TO = 15 * 60;
const DELIVERY_STEP_MINUTES = 20;

export const SCHNITZEL_FULFILLMENT = {
  pickupFrom: PICKUP_FROM,
  pickupTo: PICKUP_TO,
  deliverySlots: buildSlots(11 * 60, 15 * 60, DELIVERY_STEP_MINUTES),
} as const;

/** חלה אחת שנבחרה · סוג ותוספות */
export type Roll = { type: number; tops: string[] };

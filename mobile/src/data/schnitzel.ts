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

/**
 * צורת המארז · SCHNITZEL_FORMS בקנבס.
 * היה קיים במרקאפ מהיום הראשון ופשוט לא הועבר לאפליקציה.
 */
export const SCHNITZEL_FORMS = ['5 חלות אישיות', 'חלה משפחתית'] as const;

/** רטבים בקוקוט לצד ההזמנה */
export const COCOTTES = ['איולי עמבה', 'איולי כוסברה', 'טחינה'];
export const COCOTTE_PRICE = 3;

const PICKUP_FROM = 11 * 60;
const PICKUP_TO = 15 * 60;
const DELIVERY_STEP_MINUTES = 20;

/**
 * מתחת לכמות הזאת של מנות אין משלוח, רק איסוף עצמי.
 * שקד: ״לחסום משלוח מתחת ל-5 מנות או מתחת למארז אחד״ — כלומר
 * חמש חלות בודדות **או** מארז אחד פותחים משלוח.
 */
export const DELIVERY_MIN_MEALS = 5;

/**
 * כמה מנות סופר מארז · ⚠ **לא מהקנבס** · נגזר מכך שהמארז הוא
 * ״5 חלות אישיות״ (`SCHNITZEL_FORMS`), ולכן מארז אחד לבדו מגיע
 * בדיוק למינימום למשלוח — בדיוק כמו שביקשה.
 */
export const BOX_MEALS = 5;

/** מניין המנות בהזמנה · חלות בודדות ומארזים יחד, לשני הצדדים */
export const schnitzelMeals = (rolls: unknown[], boxes: unknown[]): number =>
  rolls.length + boxes.length * BOX_MEALS;

export const SCHNITZEL_FULFILLMENT = {
  pickupFrom: PICKUP_FROM,
  pickupTo: PICKUP_TO,
  deliverySlots: buildSlots(11 * 60, 15 * 60, DELIVERY_STEP_MINUTES),
  minMealsForDelivery: DELIVERY_MIN_MEALS,
} as const;

/** חלה אחת שנבחרה · סוג ותוספות */
export type Roll = { type: number; tops: string[] };

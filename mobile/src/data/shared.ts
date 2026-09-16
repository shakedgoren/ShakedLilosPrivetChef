/** נתונים שמשותפים לכל הקטגוריות · הועתקו מהקנבס */

/**
 * ⚠ **אפל פיי ירדה · 16 בספטמבר 2026** · בקשה של שקד: ״האופציה של
 * האפל פיי יורדת לבנתיים״. הלוגו נשאר ב-`PayLogo` כדי שהחזרה תהיה
 * מחיקת הערה אחת, וכדי שהזמנות ישנות שנשמרו איתו עדיין יוצגו.
 */
export const PAYMENTS = ['ביט', 'פייבוקס', 'מזומן'] as const;

/** אזור החלוקה · מאשדוד ועד ראשון לציון */
export const CITIES = ['יבנה', 'אשדוד', 'גדרה', 'נס ציונה', 'רחובות', 'ראשון לציון'];

export const SALE_DATE = 'שלישי · 25 באוגוסט';

/**
 * דמי משלוח · **20 ש״ח בתוך יבנה, 60 ש״ח מחוץ ליבנה**.
 * נמסר על ידי שקד ב-15 בספטמבר 2026, ותואם בדיוק את `SHIP_FEE`
 * שחולץ מקנבס הניהול (`יבנה: 20 · אחר: 60`).
 *
 * זה המקור היחיד לחישוב · מסך ההזמנה, השרת ומגשי הפירות פונים
 * לכאן, כדי שלא יהיו שני מחירונים.
 */
import { SHIP_FEE } from './adminOrders';

export const NEAR_CITY = 'יבנה';
export const OTHER_AREA = 'אחר';

export const shippingFeeFor = (city: string): number =>
  city.trim() === NEAR_CITY ? SHIP_FEE[NEAR_CITY] : SHIP_FEE[OTHER_AREA];

/** דמי המשלוח של הזמנה · 0 באיסוף עצמי */
export const deliveryFee = (ship: string, city: string): number =>
  ship === 'deliv' ? shippingFeeFor(city) : 0;

/**
 * הקטגוריות שתלויות ביום מכירה.
 * ⚠ **רק קוסקוס ושניצל** · שקד: ״ההערה של סגור להזמנות נכונה אך
 * ורק לימי מכירה של קוסקוס ושל שניצל, כל שאר ההזמנות יכולות
 * להיכנס תמיד.״ זהה ל-`SALE_CATS` בשרת.
 */
export const SALE_DAY_CATEGORIES: readonly string[] = ['cous', 'schn'];

export const hasSaleDay = (category: string) => SALE_DAY_CATEGORIES.includes(category);

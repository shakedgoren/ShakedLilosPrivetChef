/**
 * טקסטים ומידות של מסך הקוסקוס · חולצו אוטומטית מ-Order.dc.html.
 * לעדכון: node scripts/extract-couscous.mjs && node scripts/emit-couscous-copy.mjs
 *
 * המנות והמחירים יושבים ב-couscous.ts · כאן רק מה שבמרקאפ.
 */

export const COUSCOUS_TITLE = "שלישי של קוסקוס";
export const COUSCOUS_DATE = "שלישי · 25 באוגוסט";
export const COUSCOUS_INTRO = "הטעם שכולם מחכים לו, יש מסורות שלא מוותרים עליהן!\nקוסקוס עננים ביתי שמוכן באהבה, בדיוק כמו של פעם.";
export const PICKLE_NOTE = "* כל מנה מגיעה לצד סלט חמוצים אישי.";
export const ADDONS_LABEL = "תוספות";
export const TOTAL_LABEL = "סה״כ :";

/** מונה המנות בסרגל התחתון · יחיד ורבים */
export const COUNT_ONE = "מנה אחת";
export const COUNT_MANY = " מנות";
export const mealsLabel = (n: number) => (n === 1 ? COUNT_ONE : n + COUNT_MANY);

/**
 * שורת המנה · הפינה מהקנבס.
 * ⚠ לא מהקנבס · שקד ביקשה תמונות גדולות יותר וצמודות לקצוות.
 * בקנבס: תמונה 58, גובה 84, ריפוד 14.
 */
export const DISH_ROW = {
  height: 88,
  radius: 22,
  shotSize: 70,
  shotRadius: 18,
  padding: 9,
} as const;

/**
 * כרטיס התוספת · שלוש עמודות.
 * ⚠ לא מהקנבס · שקד ביקשה תמונה מעל שם התוספת בתוך הכרטיס.
 * בקנבס הכרטיס ריק מתמונה.
 */
export const ADDON_CARD = {
  radius: 16,
  padding: 9,
  gap: 8,
  columns: 3,
  /* ריבועית · תמונות התוספות הן צילומי קערה מלמעלה במסגרת ריבועית,
     וחיתוך לפס נמוך הראה רק את השולחן מסביב */
  shotAspect: 1,
  shotRadius: 12,
} as const;

/**
 * הרווח בין התיאור לרשימת המנות · מרווח של 16 בקנבס.
 * הכותרת מרחפת ב-top 30 ואזור הגלילה מתחיל ב-88.
 */
export const INTRO_GAP = 16;
export const LIST_GAP = 10;

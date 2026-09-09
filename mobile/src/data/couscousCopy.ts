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

/** שורת המנה · מהמרקאפ של הקנבס */
export const DISH_ROW = {
  height: 84,
  radius: 22,
  shotSize: 58,
  shotRadius: 16,
} as const;

/** כרטיס התוספת · שלוש עמודות, בלי תמונה */
export const ADDON_CARD = {
  radius: 16,
  padding: 9,
  gap: 8,
  columns: 3,
} as const;

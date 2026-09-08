/**
 * טקסטים ומידות של מסך השישניצל · חולצו אוטומטית מ-Schnitzel.dc.html.
 * לעדכון: node scripts/extract-schnitzel.mjs && node scripts/emit-schnitzel-copy.mjs
 *
 * המנות והמחירים יושבים ב-schnitzel.ts · כאן רק מה שבמרקאפ.
 */

export const SCHNITZEL_TITLE = "שישניצל";
export const SCHNITZEL_INTRO = "שניצל דק וקריספי/פילה עוף בטמפורה בחלה ביתית רכה,\nלצד שלל תוספות.\nלפי כמות או מארז משפחתי לחמישה.";
export const SCHNITZEL_DATE = "שישי · 28 באוגוסט";
export const GIFT_NOTE = "כנפי עוף במתנה לצד כל חלה, ברוטב מתחלף בכל שבוע ע״פ בחירות הסקר השבועי באינסטגרם.";
export const PICK_TYPE_LABEL = "בחר סוג חלה";

/** מידות כרטיס החלה · מהמרקאפ של הקנבס */
export const TYPE_CARD = {
  radius: 20,
  padV: 11,
  padH: 8,
  gap: 7,
  shotHeight: 76,
  shotRadius: 14,
  gridGap: 9,
} as const;

export const GIFT_RADIUS = 18;

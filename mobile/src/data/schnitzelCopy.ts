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

/**
 * כרטיס צורת המארז · המידות נקראו מהמרקאפ של Schnitzel.dc.html
 * (גוש `forms`) · גובה 76, פינה 16, ריפוד 10, מרווח 7, אייקון 22.
 */
export const FORM_CARD = {
  height: 76,
  radius: 16,
  padding: 10,
  gap: 7,
  glyph: 22,
  gridGap: 9,
} as const;

/** הלוח שעוטף כל גוש בחירה במצב מארז · radius 22, padding 14 */
export const PANEL = { radius: 22, padding: 14, gap: 11, stackGap: 12 } as const;

/**
 * הרווח סביב כרטיס המתנה · בקנבס יש 36 לפניו ו-18 אחריו.
 * ⚠ לא מהקנבס · שקד ביקשה להוריד אותו עוד מעט ולקרב אליו את מה
 * שאחריו, כי הרווח שנפתח בין השניים היה גדול מדי.
 */
export const GIFT_SPACE = { before: 30, after: 12 } as const;

/** כרטיס התוספת בחלונית · שלוש עמודות, השורה האחרונה ממורכזת */
export const TOP_CARD = { columns: 3, gap: 8, minHeight: 58, radius: 16 } as const;

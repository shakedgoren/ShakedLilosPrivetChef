import { hues, type CategoryKey } from '../theme/tokens';

/**
 * חמש הקטגוריות · הטקסטים הועתקו מילה במילה מקנבס העיצוב.
 * אין לשנות ניסוח כאן בלי אישור — זו הכתיבה של שקד.
 */
export type Category = {
  key: CategoryKey;
  title: string;
  sub: string;
  short: string;
  tag: string;
  desc: string;
  cta: string;
  hue: string;
  deep: string;
  rgb: string;
};

export const CATEGORIES: Category[] = [
  {
    key: 'cous',
    title: 'קוסקוס',
    sub: 'שלישי של קוסקוס',
    short: 'קוסקוס',
    tag: 'כל שלישי',
    desc: 'קוסקוס עננים ביתי שמוכן באהבה, בדיוק כמו של פעם.',
    cta: 'להזמנה',
    ...hues.cous,
  },
  {
    key: 'schn',
    title: 'שישניצל',
    sub: 'שישי של מטעמים',
    short: 'שישניצל',
    tag: 'כל שישי',
    desc: 'שניצל דק וקריספי בחלה ביתית רכה, לצד שלל תוספות.',
    cta: 'להזמנת שישניצל',
    ...hues.schn,
  },
  {
    key: 'box',
    title: 'ספיישל',
    sub: 'מארזי ספיישל',
    short: 'ספיישל',
    tag: 'לכל אירוע',
    desc: 'ארוזים בארגז עץ עם פרחי גיבסניות. המתנה המושלמת לאהובים שלכם.',
    cta: 'לבחירת מארז',
    ...hues.box,
  },
  {
    key: 'fruit',
    title: 'פירות',
    sub: 'מגשי פירות',
    short: 'פירות',
    tag: 'בעבודת יד',
    desc: 'פירות טריים שנחתכים ביום ההזמנה ומעוצבים בעבודת יד.',
    cta: 'לבחירת מגש',
    ...hues.fruit,
  },
  {
    key: 'chef',
    title: 'שף וטאבון',
    sub: 'ארוחת שף ועמדת טאבון',
    short: 'שף',
    tag: 'חוויה אישית',
    desc: 'חוויה קולינרית שמוגשת בשלבים למרכז השולחן, מנה אחר מנה.',
    cta: 'לבקשת הצעה',
    ...hues.chef,
  },
];

/** נקודת האיסוף · מופיעה בסיום כל הזמנה באיסוף עצמי */
export const PICKUP = {
  address: 'נופר 25, יבנה.',
  note: 'הוויז לא מביא לתוך החנייה, מצורפת מפת הגעה מדוייקת מכל הכיוונים האפשריים:',
  maps: [
    { file: 'parking-1', title: 'הגעה מכיוון נווה אילן' },
    { file: 'parking-2', title: 'הגעה מכיוון הרצל' },
    { file: 'parking-3', title: 'הגעה מכיוון לב יבנה' },
    { file: 'parking-4', title: 'הגעה מכיוון רוגובין' },
  ],
} as const;

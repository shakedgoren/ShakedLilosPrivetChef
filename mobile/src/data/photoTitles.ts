/**
 * שמות התמונות · מוצגים מעל התמונה כשהיא נפתחת בגודל מלא.
 *
 * ⚠ הטבלה ריקה בכוונה. שקד ביקשה שהשם יופיע מעל התמונה במרכז,
 * ואמרה שתשלח את רשימת ההתאמות בהמשך. עד שהיא תגיע — אין שם,
 * ולכן לא מוצגת שום כותרת. **אין להמציא כאן שמות.**
 *
 * המפתח הוא שם הקובץ כפי שהוא ב-`photos.ts` (למשל `home-1`).
 */
export const PHOTO_TITLES: Readonly<Record<string, string>> = {};

/** מחזיר את שם התמונה, או undefined כשעדיין אין לה שם */
export function photoTitle(name: string): string | undefined {
  return PHOTO_TITLES[name];
}

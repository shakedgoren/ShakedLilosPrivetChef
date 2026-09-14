/**
 * תמונות השדרוגים · מפתח לפי שם השדרוג בדיוק כפי שהוא ב-`chef.ts`.
 *
 * ⚠ **לא מהקנבס** · בקנבס כרטיסי השדרוגים מציגים מציין מקום מקווקו
 * בלבד, בלי תמונה. המיפוי כאן הוא לפי מה ששקד ביקשה מפורשות.
 * כל שם שאינו כאן ממשיך להציג את מציין המקום של הקנבס.
 */
export const EXTRA_PHOTOS: Record<string, string> = {
  /* עמדת טאבון */
  'מנות דג בטאבון': 'tabon-4',
  'שולחן קינוחים מעוצב': 'kinuhim-table',
  'ממשותף לאישי': 'hagasha-ishit',
  'עיצוב שולחן יוקרתי': 'arichat-shulhan',
  /* ארוחת שף פרטית */
  'חבילת שתייה ללא הגבלה': 'drink-no-limit',
};

export const extraPhoto = (name: string): string | undefined => EXTRA_PHOTOS[name];

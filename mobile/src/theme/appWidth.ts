import { Platform, useWindowDimensions } from 'react-native';

/**
 * רוחב האפליקציה בפועל · **לא תמיד רוחב החלון.**
 *
 * ⚠ **למה · 23 בספטמבר 2026** · בגרסת הדפדפן האפליקציה מוגשת
 * בעמודה ברוחב טלפון במרכז המסך (ראו `theme/webFrame.ts`). אבל
 * `useWindowDimensions()` ממשיך להחזיר את רוחב **החלון**, ולכן
 * כל מה שנגזר ממנו יצא ברוחב 1440 בתוך עמודה של 480: הלוגו נמתח
 * מעבר לקצוות והכרטיסים נחתכו.
 *
 * ⚠ **CSS לא יכול לפתור את זה** · המידה נקבעת ב-JavaScript לפני
 * שהדפדפן מצייר. `max-width` על המיכל תוחם את מה שרואים, אבל
 * החישוב עצמו כבר יצא שגוי. לכן התיקון חייב להיות באותו מקום
 * שבו קוראים את המידה.
 *
 * ⚠ **בנייד זה בדיוק `useWindowDimensions`** · אין כאן שום שינוי
 * התנהגות באפליקציה הנייטיבית, וגם לא בדפדפן של טלפון — שם
 * הרוחב ממילא קטן מהתקרה.
 *
 * ⚠ **התקרה זהה ל-`APP_COLUMN_WIDTH` שב-`webFrame.ts`** · שני
 * הקבצים מתארים את אותה עמודה. אם משנים שם, משנים גם כאן.
 */

/** אותו רוחב עמודה שמוגדר ב-webFrame.ts */
const WEB_MAX_WIDTH = 480;

/** הרוחב שהאפליקציה צריכה לחשב לפיו · חסום לרוחב העמודה בדפדפן */
export function useAppWidth(): number {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' ? Math.min(width, WEB_MAX_WIDTH) : width;
}

/** גרסה שמחזירה גם גובה · לשימושים שצריכים את שניהם */
export function useAppSize(): { width: number; height: number } {
  const { width, height } = useWindowDimensions();
  return {
    width: Platform.OS === 'web' ? Math.min(width, WEB_MAX_WIDTH) : width,
    height,
  };
}

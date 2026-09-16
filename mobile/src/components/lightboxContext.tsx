import { createContext, useContext } from 'react';

/**
 * ההקשר של ההגדלה · הופרד מ-`Lightbox.tsx` ב-16 בספטמבר 2026.
 *
 * ⚠ **זה מה ששבר את מעגל הייבוא** · `Photo` צרכה `useLightbox`
 * מתוך `Lightbox`, ו-`Lightbox` מצידה מייבאת את `Photo` כדי לצייר
 * את התמונה המוגדלת. Metro הדפיס על זה `Require cycle` בכל עלייה,
 * וזו אחת האזהרות שהצטברו לבאנר השחור שנראה מעל כפתור הכניסה.
 * ההקשר אינו תלוי באף אחד מהשניים, ולכן כאן המעגל נגמר.
 */

export type LightboxShot = { name: string; title?: string };
export type LightboxApi = { open: (name: string, title?: string) => void };

export const LightboxCtx = createContext<LightboxApi | null>(null);

/**
 * האם יש תמונה פתוחה · הופרד מהפעולות בכוונה. `Photo` צורכת רק
 * את הפעולות, וכך עשרות מופעי Photo לא מרונדרים מחדש בכל פתיחה.
 * רק `PhotoReel` מקשיבה למצב, כדי לעצור את הריצה.
 */
export const LightboxOpenCtx = createContext(false);

/** מחזיר null כשאין Provider · כך Photo עובדת גם מחוץ לאפליקציה */
export function useLightbox(): LightboxApi | null {
  return useContext(LightboxCtx);
}

/** האם תמונה פתוחה כרגע · משמש את רצועת התמונות כדי לעצור */
export function useLightboxOpen(): boolean {
  return useContext(LightboxOpenCtx);
}

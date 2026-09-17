import { useCallback, useSyncExternalStore } from 'react';

/**
 * מצב התזכורות · מקור אמת אחד לכל האפליקציה.
 *
 * ⚠ **נבנה ב-17 בספטמבר 2026** · שקד דיווחה: ״אין סנכרון בין
 * התזכורת שמופיעה בדף הבית לבין התזכורת בעמוד עצמו״.
 *
 * הסיבה: שני המקומות שאלו את השרת **בנפרד** והחזיקו מצב משלהם.
 * מתג הפעמון בשורת דף הבית שינה את שלו, החלונית במסך הקטגוריה לא
 * ידעה על כך, ולהפך — ולכן אפשר היה לראות פעמון מחוק בדף הבית
 * ו״תזכורת תישלח אלייך״ בקטגוריה באותו רגע.
 *
 * ⚠ **מפה ברמת המודול ולא הקשר ריאקט** · השורה בדף הבית והחלונית
 * בקטגוריה אינם חולקים הורה משותף שאפשר לתלות בו הקשר בלי לרנדר
 * מחדש את כל האפליקציה בכל שינוי. `useSyncExternalStore` מעדכן
 * בדיוק את מי שקורא את הקטגוריה הזו.
 *
 * ⚠ **מה שנשמר כאן הוא מה שהשרת אמר** · כל מי שכותב לכאן אחרי
 * פעולה אחראי גם להחזיר את הערך אם הקריאה לשרת נכשלה.
 */

type Listener = () => void;

const state = new Map<string, boolean>();
const listeners = new Set<Listener>();

/** עדכון מצב התזכורת של קטגוריה · מרנדר מחדש רק את מי שקורא אותה */
export function setReminder(category: string, on: boolean): void {
  if (state.get(category) === on) return;
  state.set(category, on);
  listeners.forEach((fn) => fn());
}

/** קריאה בלי מנוי · לשימוש בתוך מטפלי אירועים */
export const reminderOf = (category: string): boolean => state.get(category) ?? false;

/**
 * האם יש תזכורת לקטגוריה.
 * `undefined` = עדיין לא נשאל השרת, ואין מה להבטיח.
 */
export function useReminder(category: string): boolean | undefined {
  const subscribe = useCallback((fn: Listener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => state.get(category),
    () => state.get(category),
  );
}

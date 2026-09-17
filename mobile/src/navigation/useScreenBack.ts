import { useEffect } from 'react';
import { useNav } from './store';

/**
 * חזרה **בתוך** מסך · השלב הפנימי לפני היציאה.
 *
 * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״אם אני נמצאת בספיישלים
 * ונכנסתי לתוך קטגוריה, חזרה אחורה צריכה להחזיר אותי לספיישלים ולא
 * לעמוד הבית. כנ״ל בפינת השף — שלב אחד לפני״.
 *
 * המסך מחזיר `true` כשהוא טיפל בחזרה בעצמו, ואז הניווט **אינו**
 * יוצא ממנו. `false` (או `null`) מוציא כרגיל.
 *
 * ⚠ **המטפל חייב להיות יציב** · עטפי אותו ב-`useCallback`, אחרת
 * הוא נרשם מחדש בכל רינדור.
 */
export function useScreenBack(handler: (() => boolean) | null) {
  const { registerBack } = useNav();

  useEffect(() => {
    registerBack(handler);
    /* ⚠ חובה לנקות · אחרת המטפל של מסך שנעזב חוסם את הבא אחריו */
    return () => registerBack(null);
  }, [handler, registerBack]);
}

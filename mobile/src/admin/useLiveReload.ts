import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * טעינה חוזרת למסכי הניהול · **מקור אחד לכל המסכים.**
 *
 * ⚠ **למה זה נבנה · 11 באוקטובר 2026** · שקד: ״הנתונים לא
 * מתעדכנים בזמן אמת, הם כאילו נטענים מתוכן דמה״. שני דברים נפרדים
 * גרמו לזה, ושניהם מטופלים כאן ובקריאה לקבועי הדמה:
 *
 * · **אף מסך ניהול לא שאל את השרת פעם שנייה.** מתוך אחד-עשר
 *   המסכים רק `AdminBoard` הריץ `setInterval`; כל השאר טענו פעם
 *   אחת בהרכבה ונשארו עם מה שקיבלו. מסך שפתוח חצי שעה הציג נתונים
 *   בני חצי שעה בלי שום סימן לכך.
 * · **נתוני הדמה היו המצב ההתחלתי.** `ORDERS`, `SEED` ו-`SUPPLY`
 *   נטענו לתוך ה-state בהרכבה, ולכן הם מה שנראה **בכל פתיחה** עד
 *   שהשרת עונה — ולנצח אם הוא לא ענה. זו בדיוק ההרגשה שהיא תיארה.
 *
 * ⚠ **המרווח אינו תוקפני** · ארבעים שניות. מסכי הניהול נצפים
 * דקות ארוכות ולא נדרשת תגובה מיידית; `AdminBoard`, שהוא לוח
 * מטבח חי, שומר על הקצב המהיר שלו ואינו עובר לכאן.
 *
 * ⚠ **טעינה חוזרת לא מנקה את המסך** · הנתונים הקודמים נשארים עד
 * שהחדשים מגיעים, אחרת המסך היה מהבהב לריק כל ארבעים שניות.
 */

/** כל כמה זמן מסך ניהול שואל מחדש */
export const ADMIN_REFRESH_MS = 40_000;

export type LiveReload = {
  /** טעינה ראשונה בלבד · לא נדלק ברענונים */
  loading: boolean;
  /** נכשלה הטעינה האחרונה · הנתונים שעל המסך עלולים להיות ישנים */
  failed: boolean;
  /** רענון יזום · אחרי פעולה ששינתה נתונים */
  reload: () => void;
};

/**
 * @param live   האם יש בכלל מה לטעון · `false` מכבה הכול
 * @param load   הטעינה עצמה · חייבת להיות יציבה (`useCallback`)
 */
export function useLiveReload(live: boolean, load: () => Promise<unknown>): LiveReload {
  const [loading, setLoading] = useState(live);
  const [failed, setFailed] = useState(false);
  /* ⚠ ref · כדי שהטיימר לא יורכב מחדש בכל רינדור של הקורא */
  const first = useRef(true);

  const run = useCallback(async () => {
    if (!live) return;
    try {
      await load();
      setFailed(false);
    } catch {
      /* ⚠ שקט כלפי המשתמשת · הדגל הוא מה שהמסך מציג */
      setFailed(true);
    } finally {
      if (first.current) {
        first.current = false;
        setLoading(false);
      }
    }
  }, [live, load]);

  useEffect(() => {
    if (!live) {
      setLoading(false);
      return;
    }
    void run();
    const id = setInterval(() => void run(), ADMIN_REFRESH_MS);
    return () => clearInterval(id);
  }, [live, run]);

  return { loading, failed, reload: () => void run() };
}

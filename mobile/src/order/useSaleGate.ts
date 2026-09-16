import { useCallback, useState } from 'react';
import { apiEnabled } from '../api/config';
import { requestSaleReminder, saleDayStatus } from '../api/orders';
import { ApiError } from '../api/types';
import { COPY, orderError } from '../api/copy';
import { hasSaleDay } from '../data/shared';

/**
 * שער יום המכירה.
 *
 * ⚠ **שקד ביקשה שההתרעה תעבור ל״המשך״** · קודם ההזמנה נשלחה בשלב
 * התשלום, והשרת החזיר שם ״היום סגור״ — כלומר הלקוחה גילתה את זה
 * רק אחרי שבחרה מסירה, שעה, כתובת ואמצעי תשלום. עכשיו הבדיקה
 * קורית בלחיצה על ״המשך״, לפני שהיא ממלאת משהו.
 *
 * ⚠ **רק לקוסקוס ולשניצל** · שאר הקטגוריות אינן תלויות ביום מכירה
 * ולכן השער שקוף להן לגמרי — הוא אפילו לא פונה לשרת.
 */
export function useSaleGate(category: string) {
  const [closed, setClosed] = useState<{ note: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  /**
   * ⚠ **קונפטי במקום חלונית שנייה** · שקד ביקשה (16 בספטמבר 2026)
   * שהרשמה לתזכורת ״לא תקפיץ עוד פופאפ עם נרשמת״ אלא תעשה קונפטי.
   * לכן ההצלחה **סוגרת** את חלונית הפעמון ומדליקה את החגיגה.
   */
  const [celebrate, setCelebrate] = useState(false);

  /**
   * מריץ את `onOpen` אם אפשר להזמין, ואחרת פותח את חלונית הפעמון.
   * כשאין חיבור לשרת אין למי לשאול — ממשיכים, והשרת ידחה בהמשך
   * אם באמת סגור.
   */
  const guard = useCallback(
    async (onOpen: () => void) => {
      if (!hasSaleDay(category) || !apiEnabled) {
        onOpen();
        return;
      }
      setChecking(true);
      setErr('');
      try {
        const day = await saleDayStatus(category);
        if (day.open) {
          onOpen();
          return;
        }
        setClosed({ note: day.message });
      } catch {
        /* כשל רשת · לא חוסמים את הלקוחה בגלל בדיקה שנכשלה */
        onOpen();
      } finally {
        setChecking(false);
      }
    },
    [category],
  );

  const remind = useCallback(async () => {
    setBusy(true);
    setErr('');
    try {
      await requestSaleReminder(category);
      setClosed(null);
      setCelebrate(true);
    } catch (e) {
      setErr(e instanceof ApiError ? orderError(e.code, e.message) : COPY.saveFail);
    } finally {
      setBusy(false);
    }
  }, [category]);

  return {
    guard,
    checking,
    /** מצב חלונית ״יום המכירה עדיין לא נפתח״ */
    closed,
    note: closed?.note ?? '',
    close: useCallback(() => setClosed(null), []),
    remind,
    busy,
    err,
    /** הקונפטי רץ · מוצג במסך שמארח את השער */
    celebrate,
    endCelebrate: useCallback(() => setCelebrate(false), []),
  };
}

export type SaleGate = ReturnType<typeof useSaleGate>;

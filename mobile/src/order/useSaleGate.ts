import { useCallback, useState } from 'react';
import { useCheer } from '../components/Cheer';
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
/** הנוסחים של שקד · מילה במילה */
const REMINDER_ON = 'תזכורת הופעלה';

export function useSaleGate(category: string) {
  const [closed, setClosed] = useState<{ note: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  /**
   * ⚠ **החגיגה עברה לשכבה גלובלית · 17 בספטמבר 2026** · קודם היא
   * רונדרה בתוך מסך הקטגוריה, ולכן הניווט הביתה קטע אותה — ומשם
   * נולדה ההשהיה ששקד קראה לה איטית. עכשיו `useCheer` מציג אותה
   * מעל כל האפליקציה, והמסך חוזר הביתה מיד.
   */
  const { cheer } = useCheer();

  /**
   * ⚠ **האם כבר יש תזכורת** · בקשה של שקד: ״במידה ותזכורת הופעלה
   * כבר, לא להציע לבן אדם להפעיל שוב תזכורת״. במקרה כזה החלונית
   * רק **מודיעה** ואינה מציעה.
   */
  const [reminded, setReminded] = useState(false);

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
        setReminded(day.reminder ?? false);
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
      setReminded(true);
      setClosed(null);
      cheer(REMINDER_ON);
    } catch (e) {
      setErr(e instanceof ApiError ? orderError(e.code, e.message) : COPY.saveFail);
    } finally {
      setBusy(false);
    }
  }, [category, cheer]);

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
    /** כבר ביקשה תזכורת · החלונית מודיעה ואינה מציעה */
    reminded,
  };
}

export type SaleGate = ReturnType<typeof useSaleGate>;

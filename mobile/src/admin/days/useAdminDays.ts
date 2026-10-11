import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveReload } from '../useLiveReload';
import {
  CATS,
  SEED,
  freshQuota,
  impliedWeekdayRecord,
  mergeWeekdayDays,
  type DayCatKey,
  type DayRecord,
} from '../../data/adminDays';
import { weekdaySale } from '../../data/saleWeek';
import { todayKey } from '../../data/calendar';
import { apiEnabled } from '../../api/config';
import { adminGetDays, adminPutDay } from '../../api/admin';
import { useNav } from '../../navigation/store';
import {
  hoursOf,
  rangesOf,
  toggleHourIn,
  type BlockedRange,
} from './blockedHours';
import { nextQuotas, nextWaste, shownQuota } from './quotaMath';

const pad2 = (n: number) => String(n).padStart(2, '0');
/** מפתח היום · 2026-09-08 */
export const dayKey = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

export function useAdminDays() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  /**
   * ⚠ **החודש הנוכחי, לא זה של הקנבס · 11 באוקטובר 2026** · שקד:
   * ״בימי מכירה זה לא מציג מהחודש הנוכחי, זה מתחיל לי מספטמבר
   * ואנחנו בכלל באוקטובר״. `START_YEAR`/`START_MONTH`/`START_DAY`
   * הם **תיעוד של הארטבורד** — החודש שהמסך צויר בו — והם שימשו
   * כאן כמצב ההתחלתי. כלומר המסך נפתח בספטמבר 2026 לנצח.
   *
   * ⚠ **הקבועים נשארים בקובץ הנתונים** · `data/adminDays.ts` נוצר
   * אוטומטית מהקנבס ואין לערוך אותו ביד. מה שהשתנה הוא מי משתמש
   * בהם: כאן לא, ובדמה כן.
   */
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selected, setSelected] = useState(todayKey);
  /**
   * ⚠ **נתוני הדמה רק כשאין שרת · 11 באוקטובר 2026** · `SEED` היה
   * המצב ההתחלתי תמיד, ולכן הוא מה שנראה בכל פתיחת מסך עד
   * שהשרת עונה — ולנצח אם לא ענה. שקד דיווחה שהנתונים ״כאילו
   * נטענים מתוכן דמה״, והמסך הזה היה אחד מאלה שנשארו כך.
   *
   * ⚠ **`apiEnabled` ולא `live`** · כשיש כתובת שרת אין שום מצב
   * שבו נכון להציג ימי מכירה מומצאים — גם לא לרגע.
   */
  const [days, setDays] = useState<Record<string, DayRecord>>(() =>
    apiEnabled ? {} : (JSON.parse(JSON.stringify(SEED)) as Record<string, DayRecord>),
  );

  /**
   * ⚠ **יום שעבר אינו נערך · בקשת שקד, 11 באוקטובר 2026** · ״כל
   * התאריכים שעברו ניתן עדיין לגשת אליהם למרות שביקשתי שלא״.
   * הכלל שהיא בחרה ב-11 באוקטובר: ״כל עוד התאריך לא עבר ניתן
   * לראות ולערוך״. ב-`AdminBoardScreen` זה כבר נאכף, וכאן לא.
   *
   * ⚠ **הבדיקה יושבת ב-`put`** · זו נקודת הכתיבה **היחידה** של
   * המסך: המכסות, הפחת, פתיחת היום, חסימת שעות ומתג המארזים
   * כולם עוברים דרכה. שמירה על כל אחד מהם בנפרד הייתה שוכחת את
   * הבא בתור.
   */
  const isPast = useCallback((k: string) => k < todayKey(), []);

  const reload = useCallback(async () => {
    if (!live) return;
    const from = dayKey(year, month, 1);
    const last = new Date(year, month + 1, 0).getDate();
    const to = dayKey(year, month, last);
    const res = await adminGetDays(from, to);
    setDays(res.days as Record<string, DayRecord>);
  }, [live, year, month]);

  /**
   * ⚠ **רענון תקופתי · 11 באוקטובר 2026** · קודם הייתה כאן טעינה
   * חד־פעמית, ולכן מסך שנשאר פתוח הציג נתונים ישנים בלי שום סימן.
   * ראו `useLiveReload`.
   */
  useLiveReload(live, reload);
  const visibleDays = useMemo(() => {
    const from = dayKey(year, month, 1);
    const last = new Date(year, month + 1, 0).getDate();
    const to = dayKey(year, month, last);
    return mergeWeekdayDays(days, from, to);
  }, [days, year, month]);

  /**
   * ⚠ **שלושה שדות שאינם בטיפוס המחולץ** · `data/adminDays.ts`
   * נוצר אוטומטית מהקנבס. `waste` קיים רק בשרת, ו-`boxOpen`
   * ו-`blockedHours` נוספו ב-27 בספטמבר 2026. ההרחבה יושבת כאן
   * במקום לגעת בקובץ המחולץ.
   */
  type DayPatch = DayRecord & {
    waste?: Record<string, number>;
    boxOpen?: boolean;
    blockedHours?: BlockedRange[];
  };

/* היום הנבחר · נוצר בעצלתיים כשנוגעים בו · שלישי/שישי מקבלים ברירת יום מכירה */
  const rec = useCallback((k: string): DayRecord => visibleDays[k] ?? {}, [visibleDays]);

  /**
   * שמירת שינוי ליום · במסך ובמסד.
   *
   * ⚠ **`patch` יכול להיות פונקציה של המצב הקודם** · וזה לא נוי.
   * הצ׳יפים של שעות המשלוח נלחצים מהר, ושתי לחיצות באותו טיק
   * קוראות שתיהן את **אותו** ערך מהרינדור — ואז השנייה דורסת את
   * הראשונה ואחת מהשעות פשוט לא נחסמת. נמדד בדפדפן: ארבע לחיצות
   * רצופות השאירו שעה אחת חסומה. פונקציה נפתחת **בתוך** העדכון,
   * ולכן כל לחיצה רואה את מה שלפניה.
   */
  const put = useCallback((k: string, patch: DayPatch | ((prev: DayPatch) => DayPatch)) => {
    /* ⚠ יום שעבר · לא במסך ולא במסד. ראו `isPast` */
    if (isPast(k)) return;
    setDays((prev) => {
      const base = k in prev ? prev[k] : (impliedWeekdayRecord(k) ?? {});
      const delta = typeof patch === 'function' ? patch(base as DayPatch) : patch;
      const next = { ...base, ...delta };
      if (live) {
        void adminPutDay(k, {
          blocked: next.blocked ?? false,
          sale: next.sale ?? null,
          except: next.except ?? null,
          open: next.open ?? false,
          q: next.q ?? {},
          waste: next.waste ?? {},
          /* ⚠ נשלחים תמיד · השרת שומר את הקיים כשהשדה חסר, ולכן
             השמטה לא מוחקת — אבל שליחה מפורשת שומרת על המסך
             ועל המסד זהים גם אחרי שינוי מקומי */
          boxOpen: next.boxOpen ?? false,
          blockedHours: next.blockedHours ?? [],
        }).catch(() => undefined);
      }
      return { ...prev, [k]: next };
    });
  }, [live, isPast]);

  const step = useCallback((dir: number) => {
    setMonth((m) => {
      const next = m + dir;
      if (next < 0) {
        setYear((y) => y - 1);
        return 11;
      }
      if (next > 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return next;
    });
  }, []);

  const current = rec(selected);

  const toggleAvail = useCallback(() => {
    if (current.blocked) {
      const sale = weekdaySale(selected);
      put(
        selected,
        sale
          ? { blocked: false, except: null, sale, open: false, q: current.q ?? freshQuota(sale) }
          : { blocked: false, except: null },
      );
    } else put(selected, { blocked: true, sale: null, open: false });
  }, [current.blocked, current.q, put, selected]);

  const setSale = useCallback(
    (cat: DayCatKey) => {
      if (current.sale === cat) put(selected, { sale: null, open: false });
      else put(selected, { sale: cat, open: false, q: freshQuota(cat) });
    },
    [current.sale, put, selected],
  );

  /* חריגה ביום חסום · מתנהגת כמו יום מכירה לכל דבר */
  const setExcept = useCallback(
    (cat: DayCatKey) => {
      if (current.except === cat) put(selected, { except: null, open: false });
      else put(selected, { except: cat, open: false, q: freshQuota(cat) });
    },
    [current.except, put, selected],
  );

  /**
   * ⚠ **פונקציה ולא אובייקט · תוקן ב-29 בספטמבר 2026** · אותה
   * תקלה שנמצאה בצ׳יפים של שעות המשלוח: החשבון נעשה מתוך הרינדור,
   * ולכן שתי הקשות מהירות חישבו שתיהן מאותו מספר והשנייה דרסה את
   * הראשונה — שלוש הקשות על ״+״ העלו ב-1 במקום ב-3. ראו `put`.
   *
   * ⚠ **החשבון עצמו ב-`quotaMath`** · שם הוא נבדק, וגם שם תוקן
   * שההקשה הראשונה ממשיכה מהמספר **שמוצג** ולא מאפס.
   */
  const bumpQuota = useCallback(
    (id: string, delta: number) =>
      put(selected, (base) => ({ q: nextQuotas(base, id, delta) })),
    [put, selected],
  );

  const toggleOpen = useCallback(
    () => put(selected, { open: !current.open }),
    [current.open, put, selected],
  );

  /**
   * ⚠ **מתג מארזי שישי · בקשה של שקד (26 בספטמבר 2026)** · ארבעת
   * המארזים שנמסרים בימי שישי (״קחו כמה שבא לכם״, שתי ״חגיגה
   * בשולחן״ ו״הכל עלינו״) סגורים כברירת מחדל, ונפתחים **רק**
   * בהחלטה שלה. בבחירה מפורשת שלה זה מתג **נפרד** מ-״פתוח
   * להזמנות״: פתיחת יום שניצל אינה פותחת את המארזים ולהפך.
   */
  const boxOpen = !!(current as DayPatch).boxOpen;
  const toggleBoxOpen = useCallback(
    () => put(selected, (base) => ({ boxOpen: !base.boxOpen })),
    [put, selected],
  );

  /**
   * שעות המשלוח החסומות ביום הזה · כשעות עגולות, לצ׳יפים במסך.
   * ⚠ ההמרה לטווחים ובחזרה יושבת ב-`blockedHours.ts`.
   */
  const blockedHours = useMemo(
    () => hoursOf((current as DayPatch).blockedHours ?? []),
    [current],
  );

  /* ⚠ פונקציה ולא אובייקט · ראו ההערה ב-`put` */
  const toggleHour = useCallback(
    (h: number) =>
      put(selected, (base) => ({
        blockedHours: rangesOf(toggleHourIn(hoursOf(base.blockedHours ?? []), h)),
      })),
    [put, selected],
  );

  const clearHours = useCallback(
    () => put(selected, { blockedHours: [] }),
    [put, selected],
  );

  /* ביום חסום הקטגוריה הפעילה היא החריגה · אחרת יום המכירה */
  const activeKey = current.blocked ? current.except ?? null : current.sale ?? null;
  const cat = activeKey ? CATS[activeKey] : null;

  const quotas = useMemo(() => {
    if (!cat) return [];
    return cat.dishes.map((d) => {
      /* ⚠ אותו חשבון בדיוק של ההקשה · ראו `shownQuota` */
      const n = shownQuota(current as DayPatch, d.id);
      const sold = current.sold?.[d.id];
      /* ⚠ מנות שהתקלקלו · עברו לכאן ממסך המלאי שירד */
      const waste = (current as DayPatch).waste?.[d.id] ?? 0;
      const isOut = sold !== undefined && sold >= n;
      return {
        id: d.id,
        name: d.n,
        n,
        waste,
        /** ⚠ בלי ״טרם נמכרו״ · מוצג רק כשבאמת נמכר משהו */
        sold: sold ?? 0,
        soldLabel: isOut ? `אזל · נמכרו ${sold}` : `נמכרו ${sold}`,
      };
    });
  }, [cat, current.q, current.sold, current]);

  /**
   * הורדת מנה שהתקלקלה, נפלה או נרשמה בטעות.
   * ⚠ **עבר ממסך המלאי** · שקד ביקשה (15 בספטמבר 2026) להסיר את
   * ״מלאי מכירה״ מהמלאי, כי הוא כפילות של ימי המכירה. הפעולה
   * היחידה שהייתה רק שם — הורדת מנות — חיה עכשיו כאן.
   */
  const bumpWaste = useCallback(
    (id: string, delta: number) =>
      put(selected, (base) => ({ waste: nextWaste(base, id, delta) })),
    [put, selected],
  );

  return {
    year, month, selected, days: visibleDays, current, cat, activeKey, quotas,
    totalQuota: quotas.reduce((s, q) => s + q.n, 0),
    /** ⚠ היום שנבחר כבר עבר · המסך מציג הודעה במקום העורכים */
    selectedPast: isPast(selected),
    isPast,
    select: setSelected,
    step, rec, toggleAvail, setSale, setExcept, bumpQuota, bumpWaste, toggleOpen,
    boxOpen, toggleBoxOpen, blockedHours, toggleHour, clearHours,
  };
}

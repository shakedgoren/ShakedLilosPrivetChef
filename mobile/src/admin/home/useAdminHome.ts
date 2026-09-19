import { useCallback, useEffect, useMemo, useState } from 'react';
import { DONUT, QUOTA_STEP, REVENUE } from '../../data/adminHome';
import { CATS, DAY_NAMES, MONTHS, type DayCatKey } from '../../data/adminDays';
import { upcomingSale } from '../../data/saleWeek';
import { apiEnabled } from '../../api/config';
import { adminGetDay, adminPutDay, adminRevenue, adminSetSold, adminSummary } from '../../api/admin';
import { useNav } from '../../navigation/store';
import { tintOf } from './Charts';
import { COST_CATS, COST_DISHES } from '../../data/adminCosts';

/** פילוח קטגוריה אחת לפי מנה · כפי שהשרת מחזיר אותו */
export type SplitRow = { id: string; name: string; sold: number; revenue: number; cost: number };
export type SplitCat = { id: string; n: string; hue: string; rows: SplitRow[] };

/** גוון ברירת מחדל · רק כשהשרת עוד לא ענה בכלל */
const LAV_FALLBACK = '#7B5CBC';

/**
 * שמות קצרים לכרטיס הפילוח · **בלשון של שקד** (19 בספטמבר 2026):
 * ״שניצל דק · שניצל טמפורה · מארז דק · מארז טמפורה · אקסטרה רוטב״.
 *
 * השמות המלאים (״חלת פילה עוף טמפורה״) ארוכים מעמודת השם ברוחב
 * של טלפון ונשברו לשתי שורות.
 *
 * ⚠ **תצוגה בכרטיס הזה בלבד** · שם המנה במסד לא משתנה, ומסכי
 * העלויות, התפריט והלוח מציגים אותו כפי שהוא. אם שקד תרצה את
 * השמות הקצרים בכל מקום — זה שינוי במסד ולא כאן.
 */
const SHORT_NAME: Record<string, string> = {
  schThin: 'שניצל דק',
  schTemp: 'שניצל טמפורה',
  boxThin: 'מארז דק',
  boxTemp: 'מארז טמפורה',
  cocotte: 'אקסטרה רוטב',
};

/** שתי הקטגוריות שהבורר מחליף ביניהן · אותן שתיים כמו בשרת */
const SPLIT_IDS = ['cous', 'schn'];

/**
 * הפילוח לפני שהשרת ענה · כל המנות, באפסים.
 *
 * ⚠ **לא רשימה ריקה** · בלי זה הבורר יוצא בלי כפתורים והמקרא
 * נעלם, והמסך נראה שבור בשנייה שלפני התשובה. עם אפסים הוא נראה
 * בדיוק כמו שהוא נראה כשאין מכירות — וזה גם המצב האמיתי היום.
 *
 * ⚠ **`adminCosts` נוצר אוטומטית מהקנבס** · נקרא ממנו בלבד.
 */
const SPLIT_FALLBACK: SplitCat[] = SPLIT_IDS.map((id) => ({
  id,
  n: COST_CATS.find((c) => c.id === id)?.n ?? '',
  hue: COST_CATS.find((c) => c.id === id)?.hue ?? LAV_FALLBACK,
  rows: COST_DISHES.filter((d) => d.c === id).map((d) => ({
    id: d.id,
    name: d.name,
    sold: 0,
    revenue: 0,
    cost: 0,
  })),
}));

/**
 * ⚠ **המכסות עברו למנה ולא לקטגוריה** · שקד ביקשה (15 בספטמבר 2026)
 * ש**כל המנות** של יום המכירה יופיעו בדף הבית, עם המלאי והמכירות
 * של כל אחת. קודם הייתה כאן שורה אחת לכל קטגוריה, והמכסה של כולן
 * נדחפה למנה הראשונה — כלומר אי אפשר היה לעדכן מנה מסוימת.
 */
export type DishRow = { id: string; name: string; sold: number; quota: number };

/** יום מכירה לתצוגה · מגיע מהשרת, ובלעדיו נגזר מהחלון של שקד */
export type SaleView = {
  date: string;
  label: string;
  cat: string;
  name: string;
  hue: string;
  rgb: string;
  open: boolean;
  dishes: DishRow[];
  orders: number;
  /** כמה מנות נמכרו בהזמנות האלה · שקד מבקשת את שני המספרים יחד */
  meals: number;
  revenue: number;
};

/**
 * ״שלישי · 15 בספטמבר״ · אותה נוסחה של `hebrewDayLabel` בשרת.
 * ⚠ נחוץ גם בצד הלקוח · בלי שרת הכותרת הראתה ‎2026-09-15 גולמי.
 */
function hebrewDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dow = DAY_NAMES[new Date(y, m - 1, d).getDay()];
  return `${dow} · ${d} ב${MONTHS[m - 1]}`;
}

/** נפילה לאחור בלי שרת · יום המכירה של החלון והמכסות מהתפריט */
function offlineSale(): SaleView {
  const up = upcomingSale(new Date());
  const cat = CATS[up.cat as DayCatKey];
  return {
    date: up.date,
    label: hebrewDay(up.date),
    cat: up.cat,
    name: cat.short,
    hue: cat.hue,
    rgb: cat.rgb,
    open: false,
    dishes: cat.dishes.map((d) => ({ id: d.id, name: d.n, sold: 0, quota: d.q })),
    orders: 0,
    meals: 0,
    revenue: 0,
  };
}

/**
 * ⚠ ערכי הנפילה-לאחור נגזרים מהנקודות של הקנבס · לגרף בארטבורד
 * יש רק נתיב ונקודות, בלי מספרים. הציר שם הוא 0 ב-y=96 ו-12k
 * ב-y=8, ולכן הערך מחושב חזרה מהגובה. נבדק: הנקודה האחרונה
 * יוצאת 11,045 והתווית בקנבס אומרת ״11,000 ₪״.
 */
const fromCanvasDot = (cy?: number) =>
  cy == null ? 0 : Math.round(((96 - cy) / 88) * 12000);

/**
 * טווחי המחזור · בחירה של שקד (15 בספטמבר 2026).
 * ⚠ כל טווח מצויר בסלים שלו · היום לפי שעות, השבוע והחודש לפי
 * ימים, וחצי שנה לפי חודשים.
 */
export const REV_RANGES = [
  { id: 'day', n: 'היום' },
  { id: 'week', n: 'השבוע' },
  { id: 'month', n: 'החודש' },
  { id: 'half', n: 'חצי שנה' },
] as const;
export type RevRange = (typeof REV_RANGES)[number]['id'];

export function useAdminHome() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [sale, setSale] = useState<SaleView>(offlineSale);
  const [subtitle, setSubtitle] = useState('');
  const [badges, setBadges] = useState<Record<string, number | string | boolean>>({});
  const [month, setMonth] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [range, setRange] = useState<RevRange>('half');
  const [rev, setRev] = useState<{ label: string; total: number; points: { k: string; v: number }[] }>({
    label: REVENUE.title,
    total: REVENUE.total,
    points: REVENUE.months.map((m, i) => ({ k: m, v: fromCanvasDot(REVENUE.dots[i]?.cy) })),
  });
  /* ⚠ החודש · קוסקוס ושניצל בלבד · שתי הכרטיסיות בדף הבית */
  const [saleMonth, setSaleMonth] = useState({ revenue: 0, cost: 0 });
  /* ⚠ מגמת הרווח מהשרת · ריק = נופלים לציור הקנבס · ראו `ProfitBars` */
  const [profitTrend, setProfitTrend] = useState<{ k: string; v: number }[]>([]);
  /**
   * פילוח החודש לפי מנה · קוסקוס ושניצל בנפרד.
   *
   * ⚠ **בקשה של שקד · 19 בספטמבר 2026** · ״איפה שהדיאגרמת עוגה —
   * פילוח רק של ההכנסות מהמכירות של הקוסקוס והשניצל בכל החודש.
   * ואיפה שהיה את הדיאגרמה השנייה העמודות — פילוח רק של
   * ההוצאות״, ובנפרד לכל קטגוריה דרך כפתור מחליף.
   */
  const [saleSplit, setSaleSplit] = useState<SplitCat[]>([]);
  /** הקטגוריה שהכפתור בחר · קוסקוס או שניצל */
  const [splitCat, setSplitCat] = useState<string>('cous');
  const [donut, setDonut] = useState<{ total: number; shares: { name: string; color: string; v: number }[] } | null>(
    null,
  );

  const reload = useCallback(async () => {
    if (!live) return;
    const s = await adminSummary();
    setSubtitle(s.subtitle);
    setSale(s.sale);
    setBadges(s.badges);
    setMonth(s.month);
    setProfitTrend(s.profitTrend ?? []);
    setSaleMonth(s.saleMonth ?? { revenue: 0, cost: 0 });
    setSaleSplit(s.saleSplit ?? []);
    setDonut(s.donut);
  }, [live]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  /* הגרף נטען מחדש בכל החלפת טווח · הנתונים לא יושבים בזיכרון */
  useEffect(() => {
    if (!live) return;
    void adminRevenue(range)
      .then((r) => setRev({ label: r.label, total: r.total, points: r.points }))
      .catch(() => undefined);
  }, [live, range]);

  const toggleOpen = useCallback(() => {
    if (live) {
      void adminPutDay(sale.date, { open: !sale.open, sale: sale.cat })
        .then(reload)
        .catch(() => undefined);
      return;
    }
    setSale((v) => ({ ...v, open: !v.open }));
  }, [live, sale.date, sale.open, sale.cat, reload]);

  /**
   * עדכון המכסה של מנה אחת.
   * ⚠ המכסה לא יורדת מתחת למה שכבר נמכר · אחרת האחוזים עוברים 100
   * והלקוחה רואה מלאי שלילי.
   */
  const bumpDish = useCallback(
    (id: string, delta: number) => {
      const row = sale.dishes.find((d) => d.id === id);
      if (!row) return;
      const next = Math.max(row.sold, row.quota + delta);
      if (live) {
        void (async () => {
          const { rec } = await adminGetDay(sale.date);
          const cat = CATS[sale.cat as DayCatKey];
          const current: Record<string, number> = {
            ...(rec.q ?? Object.fromEntries(cat.dishes.map((d) => [d.id, d.q]))),
          };
          current[id] = next;
          await adminPutDay(sale.date, { open: sale.open, sale: sale.cat, q: current });
          await reload();
        })().catch(() => undefined);
        return;
      }
      setSale((v) => ({
        ...v,
        dishes: v.dishes.map((d) => (d.id === id ? { ...d, quota: next } : d)),
      }));
    },
    [sale, live, reload],
  );

  /**
   * הקלדה ידנית של מספר · גם המלאי וגם מה שנמכר.
   * ⚠ בקשה של שקד (15 בספטמבר 2026): ״בלחיצה על המספרים אוכל
   * לעדכן את זה ידנית״. המלאי נשמר במכסות היום; מה שנמכר נשמר
   * כתיקון נפרד שגובר על הספירה מההזמנות.
   */
  const setQuota = useCallback(
    (id: string, value: number) => {
      const row = sale.dishes.find((d) => d.id === id);
      if (!row) return;
      const next = Math.max(row.sold, Math.max(0, value));
      if (live) {
        void (async () => {
          const { rec } = await adminGetDay(sale.date);
          const cat = CATS[sale.cat as DayCatKey];
          const current: Record<string, number> = {
            ...(rec.q ?? Object.fromEntries(cat.dishes.map((d) => [d.id, d.q]))),
          };
          current[id] = next;
          await adminPutDay(sale.date, { open: sale.open, sale: sale.cat, q: current });
          await reload();
        })().catch(() => undefined);
        return;
      }
      setSale((v) => ({ ...v, dishes: v.dishes.map((d) => (d.id === id ? { ...d, quota: next } : d)) }));
    },
    [sale, live, reload],
  );

  const setSold = useCallback(
    (id: string, value: number | null) => {
      if (live) {
        void adminSetSold(sale.date, id, value).then(reload).catch(() => undefined);
        return;
      }
      setSale((v) => ({
        ...v,
        dishes: v.dishes.map((d) => (d.id === id ? { ...d, sold: Math.max(0, value ?? 0) } : d)),
      }));
    },
    [sale.date, live, reload],
  );

  /**
   * פילוח הקטגוריות לתצוגה.
   *
   * ⚠ **פירות בחוץ, שף בפנים** · מגשי הפירות נעשים אצל מיכל גורן
   * ואינם ההכנסה של שקד; פינת השף כן (בקשה מפורשת, 15 בספטמבר
   * 2026). כשאין שרת נופלים למקרא של הקנבס — שגם ממנו מוסרים
   * הפירות, כי `data/adminHome.ts` נוצר אוטומטית ואין לערוך אותו.
   */
  const shares = useMemo(() => {
    const rows = donut
      ? donut.shares.filter((x) => x.name !== 'פירות')
      : DONUT.legend.filter((l) => l.name !== 'פירות').map((l) => ({ name: l.name, color: l.color, v: l.pct }));
    const sum = rows.reduce((t, r) => t + r.v, 0) || 1;
    return rows.map((r) => ({ name: r.name, color: r.color, pct: Math.round((r.v / sum) * 100) }));
  }, [donut]);

  /**
   * הקטגוריה המצוירת כרגע · עם גוון לכל מנה.
   *
   * ⚠ **גוון לכל מנה מתוך גוון הקטגוריה** · כך פרוסת העוגה והעמודה
   * של אותה מנה חולקות צבע, והמקרא שמתחת לעוגה משרת את שתיהן.
   *
   * ⚠ **מסד ריק מחזיר את כל המנות עם אפס** · ולא רשימה ריקה · כך
   * שתי הדיאגרמות נשארות על המסך ורק ריקות · בקשה מפורשת של שקד.
   */
  const split = useMemo(() => {
    const rows = saleSplit.length ? saleSplit : SPLIT_FALLBACK;
    const cat = rows.find((c) => c.id === splitCat) ?? rows[0];
    if (!cat) return { id: splitCat, n: '', hue: LAV_FALLBACK, rows: [] };
    const n = cat.rows.length || 1;
    return {
      ...cat,
      rows: cat.rows.map((r, i) => ({ ...r, name: SHORT_NAME[r.id] ?? r.name, color: tintOf(cat.hue, i, n) })),
    };
  }, [saleSplit, splitCat]);

  /**
   * פרוסות העוגה · ההכנסה של כל מנה באחוזים.
   *
   * ⚠ **מסד ריק מחזיר סכום 0** · `CategoryPie` מצייר אז עוגה ריקה
   * ונייטרלית במקום להיעלם · בקשה מפורשת של שקד.
   */
  const splitShares = useMemo(() => {
    const sum = split.rows.reduce((t, x) => t + x.revenue, 0);
    return split.rows.map((r) => ({
      name: r.name,
      color: r.color,
      pct: sum ? Math.round((r.revenue / sum) * 100) : 0,
      /* ⚠ **סכום ולא אחוז · בקשה של שקד (19 בספטמבר 2026)** ·
         ״בהכנסות גם שיהיה מחיר על העוגה ולא אחוזים״. הזווית עדיין
         נגזרת מ-`pct`. */
      label: `${r.revenue.toLocaleString('en-US')} ₪`,
    }));
  }, [split]);

  /**
   * סיכום הקטגוריה שנבחרה · ארבעת המספרים שבתחתית הכרטיס.
   *
   * ⚠ **של הקטגוריה שמוצגת, לא של שתיהן** · הטבלה שמעליו היא של
   * קטגוריה אחת, והסיכום חייב להסתכם לה.
   */
  const splitSum = useMemo(() => {
    const revenue = split.rows.reduce((t, r) => t + r.revenue, 0);
    const cost = split.rows.reduce((t, r) => t + r.cost, 0);
    return {
      sold: split.rows.reduce((t, r) => t + r.sold, 0),
      revenue,
      cost,
      profit: revenue - cost,
    };
  }, [split]);

  const sold = sale.dishes.reduce((s, d) => s + d.sold, 0);
  const quota = sale.dishes.reduce((s, d) => s + d.quota, 0);

  return {
    sale,
    toggleOpen,
    bumpDish,
    setQuota,
    setSold,
    step: QUOTA_STEP,
    soldTotal: sold,
    quotaTotal: quota,
    ringPct: quota ? Math.round((sold / quota) * 100) : 0,
    live,
    range,
    setRange,
    rev,
    subtitle,
    badges,
    month,
    saleMonth,
    saleSplit,
    /** הכפתורים של הבורר · תמיד שניים, גם לפני שהשרת ענה */
    splitTabs: saleSplit.length ? saleSplit : SPLIT_FALLBACK,
    splitCat,
    setSplitCat,
    split,
    splitShares,
    splitSum,
    profitTrend,
    donut,
    shares,
  };
}

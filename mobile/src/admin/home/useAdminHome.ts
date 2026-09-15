import { useCallback, useEffect, useMemo, useState } from 'react';
import { DONUT, QUOTA_STEP, REVENUE } from '../../data/adminHome';
import { CATS, DAY_NAMES, MONTHS, type DayCatKey } from '../../data/adminDays';
import { upcomingSale } from '../../data/saleWeek';
import { apiEnabled } from '../../api/config';
import { adminGetDay, adminPutDay, adminRevenue, adminSetSold, adminSummary } from '../../api/admin';
import { useNav } from '../../navigation/store';

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
    donut,
    shares,
  };
}

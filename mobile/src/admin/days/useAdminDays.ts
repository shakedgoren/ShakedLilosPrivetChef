import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CATS,
  SEED,
  START_DAY,
  START_MONTH,
  START_YEAR,
  type DayCatKey,
  type DayRecord,
} from '../../data/adminDays';
import { apiEnabled } from '../../api/config';
import { adminGetDays, adminPutDay } from '../../api/admin';
import { useNav } from '../../navigation/store';

const pad2 = (n: number) => String(n).padStart(2, '0');
/** מפתח היום · 2026-09-08 */
export const dayKey = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

/** ברירת המכסות של קטגוריה · משמשת גם ליום מכירה וגם לחריגה */
const freshQuota = (cat: DayCatKey): Record<string, number> =>
  Object.fromEntries(CATS[cat].dishes.map((d) => [d.id, d.q]));

export function useAdminDays() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [year, setYear] = useState(START_YEAR);
  const [month, setMonth] = useState(START_MONTH);
  const [selected, setSelected] = useState(dayKey(START_YEAR, START_MONTH, START_DAY));
  const [days, setDays] = useState<Record<string, DayRecord>>(() =>
    JSON.parse(JSON.stringify(SEED)),
  );

  const reload = useCallback(async () => {
    if (!live) return;
    const from = dayKey(year, month, 1);
    const last = new Date(year, month + 1, 0).getDate();
    const to = dayKey(year, month, last);
    const res = await adminGetDays(from, to);
    setDays(res.days as Record<string, DayRecord>);
  }, [live, year, month]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  /* היום הנבחר · נוצר בעצלתיים כשנוגעים בו */
  const rec = useCallback((k: string): DayRecord => days[k] ?? {}, [days]);

  const put = useCallback((k: string, patch: DayRecord) => {
    setDays((prev) => {
      const next = { ...(prev[k] ?? {}), ...patch };
      if (live) {
        void adminPutDay(k, {
          blocked: next.blocked ?? false,
          sale: next.sale ?? null,
          except: next.except ?? null,
          open: next.open ?? false,
          q: next.q ?? {},
        }).catch(() => undefined);
      }
      return { ...prev, [k]: next };
    });
  }, [live]);

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
    if (current.blocked) put(selected, { blocked: false, except: null });
    else put(selected, { blocked: true, sale: null, open: false });
  }, [current.blocked, put, selected]);

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

  const bumpQuota = useCallback(
    (id: string, delta: number) => {
      const q = { ...(current.q ?? {}) };
      q[id] = Math.max(0, (q[id] ?? 0) + delta);
      put(selected, { q });
    },
    [current.q, put, selected],
  );

  const toggleOpen = useCallback(
    () => put(selected, { open: !current.open }),
    [current.open, put, selected],
  );

  /* ביום חסום הקטגוריה הפעילה היא החריגה · אחרת יום המכירה */
  const activeKey = current.blocked ? current.except ?? null : current.sale ?? null;
  const cat = activeKey ? CATS[activeKey] : null;

  const quotas = useMemo(() => {
    if (!cat) return [];
    return cat.dishes.map((d) => {
      const n = current.q?.[d.id] ?? d.q;
      const sold = current.sold?.[d.id];
      const isOut = sold !== undefined && sold >= n;
      return {
        id: d.id,
        name: d.n,
        n,
        soldLabel:
          sold === undefined ? 'טרם נמכרו' : isOut ? `אזל · נמכרו ${sold}` : `נמכרו ${sold}`,
      };
    });
  }, [cat, current.q, current.sold]);

  return {
    year, month, selected, days, current, cat, activeKey, quotas,
    totalQuota: quotas.reduce((s, q) => s + q.n, 0),
    select: setSelected,
    step, rec, toggleAvail, setSale, setExcept, bumpQuota, toggleOpen,
  };
}

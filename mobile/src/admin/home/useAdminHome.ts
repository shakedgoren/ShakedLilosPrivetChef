import { useCallback, useEffect, useState } from 'react';
import { QUOTAS, QUOTA_STEP, TODAY, type Quota } from '../../data/adminHome';
import { CATS, type DayCatKey } from '../../data/adminDays';
import { apiEnabled } from '../../api/config';
import { adminGetDay, adminPutDay, adminSummary } from '../../api/admin';
import { useNav } from '../../navigation/store';

const openQuotas = (): Quota[] => QUOTAS.filter((q) => q.open).map((q) => ({ ...q }));

export function useAdminHome() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [isOpen, setIsOpen] = useState(true);
  const [quotas, setQuotas] = useState<Quota[]>(openQuotas);
  const [openDate, setOpenDate] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [today, setToday] = useState<{ orders: number; revenue: number }>({
    orders: TODAY.orders,
    revenue: TODAY.revenue,
  });
  const [badges, setBadges] = useState<Record<string, number | string | boolean>>({});
  const [month, setMonth] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [donut, setDonut] = useState<{ total: number; shares: { name: string; color: string; v: number }[] } | null>(
    null,
  );

  const reload = useCallback(async () => {
    if (!live) return;
    const s = await adminSummary();
    setIsOpen(s.isOpen);
    setOpenDate(s.openDate);
    setSubtitle(s.subtitle);
    setQuotas(s.quotas);
    setToday(s.today);
    setBadges(s.badges);
    setMonth(s.month);
    setDonut(s.donut);
  }, [live]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const toggleOpen = useCallback(() => {
    if (live && openDate) {
      void adminPutDay(openDate, { open: !isOpen }).then(reload).catch(() => undefined);
      return;
    }
    setIsOpen((v) => !v);
  }, [live, openDate, isOpen, reload]);

  const bump = useCallback(
    (key: string, delta: number) => {
      const q = quotas.find((x) => x.key === key);
      if (!q) return;
      const nextQuota = Math.max(q.sold, q.quota + delta);
      const date = (q as Quota & { date?: string }).date;
      if (live && date) {
        void (async () => {
          const { rec } = await adminGetDay(date);
          const cat = CATS[key as DayCatKey];
          const current = {
            ...(rec.q ??
              (cat ? Object.fromEntries(cat.dishes.map((d) => [d.id, d.q])) : {})),
          };
          const first = Object.keys(current)[0];
          if (first) current[first] = Math.max(0, (current[first] ?? 0) + delta);
          await adminPutDay(date, { open: true, sale: key, q: current });
          await reload();
        })().catch(() => undefined);
        return;
      }
      setQuotas((list) => list.map((row) => (row.key === key ? { ...row, quota: nextQuota } : row)));
    },
    [quotas, live, reload],
  );

  const sold = quotas.reduce((s, q) => s + q.sold, 0);
  const quota = quotas.reduce((s, q) => s + q.quota, 0);

  return {
    isOpen,
    toggleOpen,
    quotas,
    bump,
    step: QUOTA_STEP,
    ringPct: quota ? `${Math.round((sold / quota) * 100)}%` : '—',
    note:
      quotas.length > 1
        ? 'נמכר מתוך המכסה · שני ימי מכירה פתוחים'
        : `נמכר מתוך המכסה של ${quotas[0] ? quotas[0].name : '—'}`,
    live,
    subtitle,
    today,
    badges,
    month,
    donut,
  };
}

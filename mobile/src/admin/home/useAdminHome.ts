import { useCallback, useState } from 'react';
import { QUOTAS, QUOTA_STEP, type Quota } from '../../data/adminHome';

/** רק ימי המכירה הפתוחים נכנסים ללוח · ביום קוסקוס אין מה להראות מכסות שישניצל */
const openQuotas = (): Quota[] => QUOTAS.filter((q) => q.open).map((q) => ({ ...q }));

export function useAdminHome() {
  const [isOpen, setIsOpen] = useState(true);
  const [quotas, setQuotas] = useState<Quota[]>(openQuotas);

  const toggleOpen = useCallback(() => setIsOpen((v) => !v), []);

  /* המכסה לא יורדת מתחת למה שכבר נמכר */
  const bump = useCallback((key: string, delta: number) => {
    setQuotas((list) =>
      list.map((q) =>
        q.key === key ? { ...q, quota: Math.max(q.sold, q.quota + delta) } : q,
      ),
    );
  }, []);

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
  };
}

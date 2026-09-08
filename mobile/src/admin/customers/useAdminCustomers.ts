import { useCallback, useMemo, useState } from 'react';
import { PEOPLE, REGULAR, type Person } from '../../data/adminCustomers';

export type CustomerFilter = 'all' | 'reg' | 'new';

/** מספר מנורמל · כדי שכל הצורות של אותו טלפון ייחשבו זהות */
const norm = (v: string) => String(v ?? '').replace(/[-\s]/g, '').replace(/^\+972/, '0');

export const isRegular = (p: Person) => p.orders >= REGULAR;

/** אנשי הקשר מסודרים לפי א־ב · localeCompare מטפל בעברית */
const SORTED = [...PEOPLE].sort((x, y) => x.name.localeCompare(y.name, 'he'));

const matchesFilter = (p: Person, f: CustomerFilter) =>
  f === 'all' ? true : f === 'reg' ? isRegular(p) : !isRegular(p);

export function useAdminCustomers() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [open, setOpen] = useState('');
  /* ההערות ניתנות לעריכה · פיצוי, אלרגיה, כל דבר ששווה לזכור */
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(PEOPLE.map((p) => [p.name, p.note])),
  );
  /* שם הלקוחה שההזמנות הקודמות שלה פתוחות */
  const [histFor, setHistFor] = useState<string | null>(null);

  const setNote = useCallback(
    (name: string, v: string) => setNotes((m) => ({ ...m, [name]: v })),
    [],
  );

  const search = useCallback((v: string) => {
    setQuery(v);
    setOpen('');
  }, []);

  const pickFilter = useCallback((f: CustomerFilter) => {
    setFilter(f);
    setOpen('');
  }, []);

  const toggle = useCallback((name: string) => setOpen((cur) => (cur === name ? '' : name)), []);

  /* חיפוש · שם או טלפון, עם נרמול פורמטים */
  const shown = useMemo(() => {
    const q = query.trim();
    return SORTED.filter((p) => matchesFilter(p, filter)).filter(
      (p) => q === '' || p.name.includes(q) || norm(p.phone).includes(norm(q)),
    );
  }, [query, filter]);

  const count = useCallback(
    (f: CustomerFilter) => PEOPLE.filter((p) => matchesFilter(p, f)).length,
    [],
  );

  return {
    query, filter, open, notes, histFor, shown, count,
    totalSpent: PEOPLE.reduce((s, p) => s + p.spent, 0),
    search, pickFilter, toggle, setNote,
    openHist: useCallback((name: string) => setHistFor(name), []),
    closeHist: useCallback(() => setHistFor(null), []),
  };
}

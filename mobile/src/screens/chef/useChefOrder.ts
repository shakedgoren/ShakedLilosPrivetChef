import { useCallback, useMemo, useState } from 'react';
import {
  CHEF_PACKAGES,
  STYLES,
  STYLES_ALL,
  priceOfPackage,
  type ChefPackage,
  type ChefSection,
} from '../../data/chef';
import type { OrderLine } from '../../order/types';

export type Picks = Record<string, any>;

/** סעיף שתלוי בבחירה קודמת · לא מוצג ולא נדרש עד שהיא נעשית */
const isDormant = (s: ChefSection, picks: Picks) => !!s.when && picks[s.when.id] !== s.when.is;

/** בחירה יחידה */
const SINGLE = ['grid', 'tiers', 'pair'];
/** בחירה מרובה */
const MULTI = ['multi', 'multicap', 'sauces', 'cards'];

const sectionReady = (s: ChefSection, picks: Picks): boolean => {
  if (!s.req || isDormant(s, picks)) return true;
  const v = picks[s.id];
  if (SINGLE.includes(s.kind)) return !!v;
  if (MULTI.includes(s.kind)) {
    const n = Array.isArray(v) ? v.length : 0;
    return s.cap != null ? n === s.cap : n > 0;
  }
  if (s.kind === 'stepper') return typeof v === 'number' && v > 0;
  if (s.kind === 'cal' || s.kind === 'addr') return !!v;
  if (s.kind === 'pairtext') return (s.ids as string[]).every((id) => !!picks[id]);
  return true;
};

/** ערכי הפתיחה של חבילה · כמו בקנבס, כדי שהמחיר יתאים למה שמוצג */
const seedPicks = (pkg: ChefPackage): Picks => {
  const out: Picks = {};
  pkg.pages.flat().forEach((x) => {
    if (x.kind === 'stepper') out[x.id] = x.min;
    else if (['multi', 'multicap', 'sauces'].includes(x.kind)) out[x.id] = [];
    else if (x.kind === 'cards' && x.multi) out[x.id] = [];
    else if (['text', 'cal', 'addr'].includes(x.kind)) out[x.id] = '';
  });
  return out;
};

export function useChefOrder() {
  /* null = בחירת החבילה · אחרת האינדקס של החבילה שנפתחה */
  const [current, setCurrent] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [picks, setPicks] = useState<Picks>({});

  const pkg: ChefPackage | null = current === null ? null : CHEF_PACKAGES[current];
  const sections: ChefSection[] = pkg ? (pkg.pages[page] ?? []) : [];

  const openPackage = useCallback((i: number) => {
    setCurrent(i);
    setPage(0);
    setPicks(seedPicks(CHEF_PACKAGES[i]));
  }, []);

  const backToList = useCallback(() => {
    setCurrent(null);
    setPage(0);
    setPicks({});
  }, []);

  /** הסגנונות שנפתחים תלויים בציר · בשרי פותח את כולם */
  const stylesFor = useCallback(
    (concept: string) => (concept === 'בשרי' ? STYLES : STYLES_ALL),
    [],
  );

  const select = useCallback(
    (id: string, value: string) => {
      setPicks((p) => {
        const next = { ...p, [id]: value };
        /* החלפת ציר מאפסת סגנון שכבר אינו זמין */
        if (id === 'concept' && next.style && !stylesFor(value).includes(next.style)) {
          delete next.style;
        }
        return next;
      });
    },
    [stylesFor],
  );

  const toggle = useCallback((id: string, value: string, cap?: number | null) => {
    setPicks((p) => {
      const cur: string[] = Array.isArray(p[id]) ? p[id] : [];
      const on = cur.includes(value);
      if (!on && cap != null && cur.length >= cap) return p;
      return { ...p, [id]: on ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  }, []);

  const setValue = useCallback((id: string, value: unknown) => {
    setPicks((p) => ({ ...p, [id]: value }));
  }, []);

  const pageReady = useMemo(
    () => sections.every((s) => sectionReady(s, picks)),
    [sections, picks],
  );

  const lastPage = pkg ? page >= pkg.pages.length - 1 : false;

  const next = useCallback(() => {
    if (!pkg || !pageReady) return;
    setPage((n) => Math.min(pkg.pages.length - 1, n + 1));
  }, [pkg, pageReady]);

  const prev = useCallback(() => {
    if (page === 0) backToList();
    else setPage((n) => n - 1);
  }, [page, backToList]);

  const total = pkg ? priceOfPackage(pkg, picks) : 0;

  const lines: OrderLine[] = useMemo(() => {
    if (!pkg) return [];
    const out: OrderLine[] = [{ qty: picks.guests || 1, name: pkg.name, sum: total }];
    const add = (label: string, v: unknown) => {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      const text = Array.isArray(v)
        ? v.map((x) => (typeof x === 'string' ? x : x?.n ?? '')).filter(Boolean).join(' · ')
        : String(v);
      if (text) out.push({ qty: 1, name: `${label} · ${text}`, sum: 0 });
    };
    add('ציר', picks.concept);
    add('סגנון', picks.style);
    add('מסלול', picks.tier);
    add('סועדים', picks.guests);
    add('אירוע', picks.occasion);
    add('תוספות', picks.extras ?? picks.textras);
    return out;
  }, [pkg, picks, total]);

  return {
    packages: CHEF_PACKAGES,
    current, pkg, page, sections, openPackage, backToList,
    picks, select, toggle, setValue, stylesFor,
    pageReady, lastPage, next, prev,
    total, lines,
  };
}

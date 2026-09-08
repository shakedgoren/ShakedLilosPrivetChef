import { useCallback, useMemo, useState } from 'react';
import { BOXES, priceOfBox, type Box, type Section } from '../../data/boxes';
import type { OrderLine } from '../../order/types';

export type Picks = Record<string, any>;

/** סכום הכמויות בסעיף מרובה־כמות (row / count) */
export const sumOf = (v: unknown): number =>
  v && typeof v === 'object' ? Object.values(v as Record<string, number>).reduce((s, n) => s + n, 0) : 0;

/** סעיף מוסתר שלא נפתח עדיין · לא נחשב לחובה */
const isDormant = (s: Section, picks: Picks) =>
  !!s.when && picks[s.when.id] !== s.when.is;

/** האם כל הבחירות בסעיף מלאות */
const sectionReady = (s: Section, picks: Picks): boolean => {
  if (isDormant(s, picks)) return true;
  if (['chips', 'grid', 'cards', 'pair', 'hidden'].includes(s.kind)) return !!picks[s.id!];
  if ((s.kind === 'count' || s.kind === 'row') && s.cap != null) return sumOf(picks[s.id!]) === s.cap;
  return true;
};

export function useBoxesOrder() {
  /* null = מסך רשימת המארזים · אחרת האינדקס של המארז שנפתח */
  const [current, setCurrent] = useState<number | null>(null);
  const [picks, setPicks] = useState<Picks>({});

  const box: Box | null = current === null ? null : BOXES[current];

  const openBox = useCallback((i: number) => {
    setCurrent(i);
    setPicks({});
  }, []);

  const backToList = useCallback(() => {
    setCurrent(null);
    setPicks({});
  }, []);

  /** בחירה יחידה · גריד, קלפים, זוג, מוסתר */
  const select = useCallback((id: string, value: string) => {
    setPicks((p) => ({ ...p, [id]: value }));
  }, []);

  const setText = useCallback((id: string, value: string) => {
    setPicks((p) => ({ ...p, [id]: value }));
  }, []);

  const setNumber = useCallback((id: string, value: number) => {
    setPicks((p) => ({ ...p, [id]: value }));
  }, []);

  /** כמות לפריט בתוך סעיף מרובה־כמות · 0 מוריד אותו מהבחירה */
  const setQty = useCallback((id: string, name: string, value: number) => {
    setPicks((p) => {
      const cur: Record<string, number> = { ...(p[id] || {}) };
      if (value <= 0) delete cur[name];
      else cur[name] = value;
      return { ...p, [id]: cur };
    });
  }, []);

  const total = box ? priceOfBox(box, picks) : 0;

  const ready = useMemo(() => {
    if (!box) return false;
    if (box.key === 'free') return total > 0;
    return box.sections.every((s) => sectionReady(s, picks));
  }, [box, picks, total]);

  /** שורות הסיכום · המארז ואחריו הבחירות שנעשו בו */
  const lines: OrderLine[] = useMemo(() => {
    if (!box) return [];
    const out: OrderLine[] = [{ qty: 1, name: box.name, sum: total }];
    box.sections.forEach((s) => {
      if (!s.id || isDormant(s, picks)) return;
      const v = picks[s.id];
      if (!v) return;
      if (typeof v === 'string') out.push({ qty: 1, name: `${s.label || s.id} · ${v}`, sum: 0 });
      else if (typeof v === 'number') out.push({ qty: v, name: s.label || s.id, sum: 0 });
      else {
        Object.entries(v as Record<string, number>).forEach(([k, n]) =>
          out.push({ qty: n, name: `${k}${s.unit ? ` ${s.unit}` : ''}`, sum: 0 }),
        );
      }
    });
    return out;
  }, [box, picks, total]);

  return {
    boxes: BOXES,
    current, box, openBox, backToList,
    picks, select, setText, setNumber, setQty,
    total, ready, lines,
  };
}

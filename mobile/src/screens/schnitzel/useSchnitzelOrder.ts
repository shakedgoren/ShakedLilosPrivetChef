import { useCallback, useMemo, useState } from 'react';
import {
  COCOTTES,
  COCOTTE_PRICE,
  SCHNITZEL_TYPES,
  type Roll,
} from '../../data/schnitzel';
import type { OrderLine } from '../../order/types';

/** החלונית של בחירת התוספות · target קובע אם היא נכנסת לחלות או למארז */
export type Pop = {
  target: 'unit' | 'box';
  type: number;
  tops: string[];
  /** אינדקס החלה שנערכת, 'box' לעריכת המארז, null להוספה חדשה */
  edit: number | 'box' | null;
} | null;

export function useSchnitzelOrder() {
  /* 0 = לפי יחידה · 1 = מארז */
  const [mode, setMode] = useState(0);
  const [basket, setBasket] = useState<Roll[]>([]);
  const [box, setBox] = useState<Roll | null>(null);
  /* צורת המארז · 0 = חמש חלות אישיות · 1 = חלה משפחתית · SCHNITZEL_FORMS בקנבס */
  const [form, setForm] = useState(0);
  const [cocottes, setCocottes] = useState<number[]>(() => COCOTTES.map(() => 0));
  const [pop, setPop] = useState<Pop>(null);

  const isUnit = mode === 0;

  /* בחירת סוג פותחת את החלונית · התוספות נבחרות שם ולא בעמוד */
  const openAdd = useCallback((type: number) => {
    setPop({ target: 'unit', type, tops: [], edit: null });
  }, []);

  const openEdit = useCallback(
    (i: number) => {
      const b = basket[i];
      setPop({ target: 'unit', type: b.type, tops: [...b.tops], edit: i });
    },
    [basket],
  );

  const openBox = useCallback(
    (type: number) => {
      /* אותו סוג · שומרים את התוספות שכבר נבחרו */
      const keep = box && box.type === type ? [...box.tops] : [];
      setPop({ target: 'box', type, tops: keep, edit: null });
    },
    [box],
  );

  const openBoxEdit = useCallback(() => {
    if (!box) return;
    setPop({ target: 'box', type: box.type, tops: [...box.tops], edit: 'box' });
  }, [box]);

  const closePop = useCallback(() => setPop(null), []);

  const toggleTop = useCallback((name: string) => {
    setPop((p) => {
      if (!p) return p;
      const on = p.tops.includes(name);
      return { ...p, tops: on ? p.tops.filter((x) => x !== name) : [...p.tops, name] };
    });
  }, []);

  const commitPop = useCallback(() => {
    setPop((p) => {
      if (!p) return null;
      const row: Roll = { type: p.type, tops: [...p.tops] };
      if (p.target === 'box') setBox(row);
      else if (p.edit === null) setBasket((b) => [...b, row]);
      else setBasket((b) => b.map((x, j) => (j === p.edit ? row : x)));
      return null;
    });
  }, []);

  const removeRoll = useCallback((i: number) => {
    setBasket((b) => b.filter((_, j) => j !== i));
  }, []);

  const bumpCocotte = useCallback((i: number, d: number) => {
    setCocottes((c) => c.map((v, j) => (j === i ? Math.max(0, v + d) : v)));
  }, []);

  const itemsTotal = isUnit
    ? basket.reduce((s, b) => s + SCHNITZEL_TYPES[b.type].unit, 0)
    : box
      ? SCHNITZEL_TYPES[box.type].box
      : 0;
  const cocotteTotal = cocottes.reduce((s, v) => s + v * COCOTTE_PRICE, 0);
  const total = itemsTotal + cocotteTotal;

  const lines: OrderLine[] = useMemo(() => {
    const main: OrderLine[] = isUnit
      ? basket.map((b, i) => ({
          qty: 1,
          name: `חלה ${i + 1} · ${SCHNITZEL_TYPES[b.type].short}`,
          sum: SCHNITZEL_TYPES[b.type].unit,
        }))
      : box
        ? [{ qty: 1, name: `מארז · ${SCHNITZEL_TYPES[box.type].short}`, sum: SCHNITZEL_TYPES[box.type].box }]
        : [];
    const coc: OrderLine[] = cocottes
      .map((v, i) => ({ qty: v, name: `קוקוט ${COCOTTES[i]}`, sum: v * COCOTTE_PRICE }))
      .filter((l) => l.qty > 0);
    return [...main, ...coc];
  }, [isUnit, basket, box, cocottes]);

  return {
    mode, setMode, isUnit,
    form, setForm,
    basket, box, cocottes, pop,
    openAdd, openEdit, openBox, openBoxEdit, closePop, toggleTop, commitPop, removeRoll, bumpCocotte,
    total, lines,
  };
}

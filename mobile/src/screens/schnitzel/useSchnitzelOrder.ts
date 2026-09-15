import { useCallback, useMemo, useState } from 'react';
import {
  COCOTTES,
  COCOTTE_PRICE,
  SCHNITZEL_TYPES,
  schnitzelMeals,
  type Roll,
} from '../../data/schnitzel';
import type { OrderLine } from '../../order/types';

/** החלונית של בחירת התוספות · target קובע אם היא נכנסת לחלות או למארזים */
export type Pop = {
  target: 'unit' | 'box';
  type: number;
  tops: string[];
  /** אינדקס הפריט שנערך · null להוספה חדשה */
  edit: number | null;
} | null;

export function useSchnitzelOrder() {
  /* 0 = לפי יחידה · 1 = מארז */
  const [mode, setMode] = useState(0);
  const [basket, setBasket] = useState<Roll[]>([]);
  /* המארזים · רשימה בדיוק כמו החלות הבודדות, ולא מארז יחיד.
     שקד ביקשה שאפשר יהיה להזמין כמה מארזים באותה הזמנה. */
  const [boxes, setBoxes] = useState<Roll[]>([]);
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

  /* כל בחירת סוג מוסיפה מארז חדש · אין ״שומרים את הקודם״ */
  const openBox = useCallback((type: number) => {
    setPop({ target: 'box', type, tops: [], edit: null });
  }, []);

  const openBoxEdit = useCallback(
    (i: number) => {
      const b = boxes[i];
      if (!b) return;
      setPop({ target: 'box', type: b.type, tops: [...b.tops], edit: i });
    },
    [boxes],
  );

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
      const put = p.target === 'box' ? setBoxes : setBasket;
      if (p.edit === null) put((list) => [...list, row]);
      else put((list) => list.map((x, j) => (j === p.edit ? row : x)));
      return null;
    });
  }, []);

  const removeRoll = useCallback((i: number) => {
    setBasket((b) => b.filter((_, j) => j !== i));
  }, []);

  const removeBox = useCallback((i: number) => {
    setBoxes((b) => b.filter((_, j) => j !== i));
  }, []);

  const bumpCocotte = useCallback((i: number, d: number) => {
    setCocottes((c) => c.map((v, j) => (j === i ? Math.max(0, v + d) : v)));
  }, []);

  /**
   * ⚠ **הזמנה אחת** · הסה״כ סופר חלות בודדות ומארזים יחד, ולא רק
   * את מה שהלשונית הפעילה מציגה. קודם הוא היה `isUnit ? basket : boxes`,
   * ולכן מעבר ללשונית השנייה העלים את מה שכבר נבחר מהסכום.
   */
  const itemsTotal =
    basket.reduce((s, b) => s + SCHNITZEL_TYPES[b.type].unit, 0) +
    boxes.reduce((s, b) => s + SCHNITZEL_TYPES[b.type].box, 0);
  const cocotteTotal = cocottes.reduce((s, v) => s + v * COCOTTE_PRICE, 0);
  const total = itemsTotal + cocotteTotal;

  /** מניין המנות למשלוח · מארז נחשב BOX_MEALS מנות */
  const meals = schnitzelMeals(basket, boxes);

  const lines: OrderLine[] = useMemo(() => {
    const rolls: OrderLine[] = basket.map((b, i) => ({
      qty: 1,
      name: `חלה ${i + 1} · ${SCHNITZEL_TYPES[b.type].short}`,
      sum: SCHNITZEL_TYPES[b.type].unit,
    }));
    const packs: OrderLine[] = boxes.map((b, i) => ({
      qty: 1,
      name: `מארז ${i + 1} · ${SCHNITZEL_TYPES[b.type].short}`,
      sum: SCHNITZEL_TYPES[b.type].box,
    }));
    const coc: OrderLine[] = cocottes
      .map((v, i) => ({ qty: v, name: `קוקוט ${COCOTTES[i]}`, sum: v * COCOTTE_PRICE }))
      .filter((l) => l.qty > 0);
    return [...rolls, ...packs, ...coc];
  }, [basket, boxes, cocottes]);

  /**
   * ⚠ ״להזמין שוב״ · טוען את החלות, המארזים והקוקוטים של ההזמנה
   * הקודמת. מסונן לערכים חוקיים בלבד — פרטי הזמנה ישנה עלולים
   * להצביע על סוג שכבר לא קיים בתפריט.
   */
  const loadDetails = useCallback((d: Record<string, unknown>) => {
    const rolls = (Array.isArray(d.rolls) ? d.rolls : []) as Roll[];
    const packs = (Array.isArray(d.boxes) ? d.boxes : []) as Roll[];
    const keep = (r: Roll) =>
      r && typeof r.type === 'number' && !!SCHNITZEL_TYPES[r.type];
    const clean = (list: Roll[]) =>
      list.filter(keep).map((r) => ({ type: r.type, tops: Array.isArray(r.tops) ? [...r.tops] : [] }));
    setBasket(clean(rolls));
    setBoxes(clean(packs));
    if (clean(packs).length > 0 && clean(rolls).length === 0) setMode(1);
    const coc = Array.isArray(d.cocottes) ? d.cocottes : [];
    setCocottes(COCOTTES.map((_, i) => {
      const v = Number(coc[i]);
      return Number.isFinite(v) && v > 0 ? v : 0;
    }));
  }, []);

  return {
    loadDetails,
    mode, setMode, isUnit,
    form, setForm,
    basket, boxes, cocottes, pop,
    openAdd, openEdit, openBox, openBoxEdit, closePop, toggleTop, commitPop,
    removeRoll, removeBox, bumpCocotte,
    total, meals, lines,
  };
}

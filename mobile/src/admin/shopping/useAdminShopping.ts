import { useCallback, useMemo, useState } from 'react';
import {
  AREA,
  DEFAULT_GROUP,
  DEFAULT_UNIT,
  GROUPS,
  MONTHS,
  PANTRY,
  SEED,
  START_AREA,
  type PantryItem,
  type ShopItem,
} from '../../data/adminShopping';

export type ShopRow = ShopItem & { id: number };

export type NewShopItem = {
  name: string;
  g: string;
  unit: string;
  qty: string;
  price: string;
};

const emptyItem = (g: string, unit: string): NewShopItem => ({ name: '', g, unit, qty: '', price: '' });

const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};
const trim = (v: string) => String(v ?? '').trim();
const pad2 = (n: number) => String(n).padStart(2, '0');

/** אלף מופרד בפסיק · כמו nf בקנבס */
export const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** סה״כ לשורה · כמות כפול מחיר ליחידה */
export const lineSum = (x: { qty: string; price: string }) => num(x.qty) * num(x.price);

/** מה שולם · הסכום בפועל אם נרשם, אחרת המחושב. רק על מה שסומן */
const paid = (x: ShopRow) => (x.done ? (trim(x.actual) !== '' ? num(x.actual) : lineSum(x)) : 0);

const MAX_HITS = 4;

export function useAdminShopping() {
  const [area, setArea] = useState(START_AREA);
  const [opened, setOpened] = useState(() => new Date());
  const [items, setItems] = useState<ShopRow[]>(() => SEED.map((x, i) => ({ ...x, id: i })));
  const [nextId, setNextId] = useState(SEED.length);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<NewShopItem>(() => emptyItem(DEFAULT_GROUP, DEFAULT_UNIT));

  const toggle = useCallback((id: number) => {
    setItems((list) => list.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }, []);

  const drop = useCallback((id: number) => {
    setItems((list) => list.filter((x) => x.id !== id));
  }, []);

  const setField = useCallback(
    <K extends keyof NewShopItem>(k: K, v: NewShopItem[K]) => setDraft((d) => ({ ...d, [k]: v })),
    [],
  );

  /* בחירה מהפנקס · הקבוצה, היחידה והמחיר האחרון נמשכים איתה */
  const pickPantry = useCallback((x: PantryItem) => {
    setDraft((d) => ({ ...d, name: x.name, g: x.g, unit: x.unit, price: String(x.price) }));
  }, []);

  /* השלמה מהפנקס · נסגרת ברגע שהשם מדויק */
  const hits = useMemo(() => {
    const q = trim(draft.name);
    if (q === '') return [];
    if (PANTRY.some((x) => x.name === q)) return [];
    return PANTRY.filter((x) => x.name.includes(q)).slice(0, MAX_HITS);
  }, [draft.name]);

  const addReady = trim(draft.name) !== '' && num(draft.qty) > 0;

  const saveAdd = useCallback(() => {
    if (!addReady) return;
    setItems((list) => [
      ...list,
      {
        id: nextId,
        g: draft.g,
        name: trim(draft.name),
        unit: draft.unit,
        qty: trim(draft.qty),
        price: trim(draft.price),
        done: false,
        actual: '',
      },
    ]);
    setNextId((i) => i + 1);
    setAddOpen(false);
    setDraft(emptyItem(draft.g, draft.unit));
  }, [addReady, draft, nextId]);

  /* סגירת הרשימה · נרשמת הוצאה, הקנייה נכנסת להיסטוריה ונפתחת רשימה ריקה */
  const closeList = useCallback(() => {
    setItems((list) => {
      if (list.filter((x) => x.done).length === 0) return list;
      setOpened(new Date());
      return [];
    });
  }, []);

  const doneCount = items.filter((x) => x.done).length;

  const groups = useMemo(
    () =>
      GROUPS.map((g) => {
        const list = items.filter((x) => x.g === g);
        return {
          name: g,
          count: `${list.filter((x) => x.done).length}/${list.length}`,
          items: list,
        };
      }).filter((g) => g.items.length > 0),
    [items],
  );

  /** שם הקנייה · שיוך, תאריך ושעה. ייחודי לכל קנייה */
  const title = `${AREA[area].n} · ${opened.getDate()} ${MONTHS[opened.getMonth()]} · ${pad2(opened.getHours())}:${pad2(opened.getMinutes())}`;

  return {
    area, setArea, items, groups, draft, hits, addOpen, addReady, title, doneCount,
    estSum: items.reduce((s, x) => s + lineSum(x), 0),
    actSum: items.reduce((s, x) => s + paid(x), 0),
    pct: items.length ? Math.round((doneCount / items.length) * 100) : 0,
    canClose: doneCount > 0,
    lineTotal: num(draft.qty) * num(draft.price),
    toggle, drop, setField, pickPantry, saveAdd, closeList,
    openAdd: useCallback(() => setAddOpen(true), []),
    closeAdd: useCallback(() => setAddOpen(false), []),
  };
}

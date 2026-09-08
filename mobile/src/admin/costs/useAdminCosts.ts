import { useCallback, useState } from 'react';
import {
  DISHES,
  IMPORT,
  PANTRY,
  START_CAT,
  START_SUB,
  type Buy,
  type CostCatKey,
  type PantryRow,
} from '../../data/adminCosts';
import { trim, type EditableDish, type EditablePart } from './costEngine';

const MAX_HITS = 3;

/** המנות מהקנבס · מומרות לצורה הנערכת, שבה כל שדה מספרי הוא מחרוזת */
const seed = (): EditableDish[] =>
  DISHES.map((d) => ({
    id: d.id,
    c: d.c,
    sub: d.sub ?? null,
    name: d.name,
    mode: d.mode,
    note: d.note ?? '',
    from: d.from ?? [],
    price: String(d.price),
    yld: String(d.yld === undefined ? 0 : d.yld),
    parts: (d.parts ?? []).map((p, j) => ({
      id: j,
      name: p.n,
      price: String(p.price),
      qty: String(p.qty),
    })),
  }));

export function useAdminCosts() {
  const [cat, setCat] = useState<CostCatKey>(START_CAT);
  const [sub, setSub] = useState(START_SUB);
  const [open, setOpen] = useState('');
  const [seen, setSeen] = useState(false);
  const [impOpen, setImpOpen] = useState(false);
  const [impDone, setImpDone] = useState('');
  const [dishes, setDishes] = useState<EditableDish[]>(seed);

  const patch = useCallback((id: string, p: Partial<EditableDish>) => {
    setDishes((list) => list.map((d) => (d.id === id ? { ...d, ...p } : d)));
  }, []);

  const patchPart = useCallback((id: string, pid: number, p: Partial<EditablePart>) => {
    setDishes((list) =>
      list.map((d) =>
        d.id === id
          ? { ...d, parts: d.parts.map((x) => (x.id === pid ? { ...x, ...p } : x)) }
          : d,
      ),
    );
  }, []);

  const addPart = useCallback((id: string) => {
    setDishes((list) =>
      list.map((d) => {
        if (d.id !== id) return d;
        const next = d.parts.reduce((mx, p) => Math.max(mx, p.id + 1), 0);
        return { ...d, parts: [...d.parts, { id: next, name: '', price: '', qty: '' }] };
      }),
    );
  }, []);

  const removePart = useCallback((id: string, pid: number) => {
    setDishes((list) =>
      list.map((d) => (d.id === id ? { ...d, parts: d.parts.filter((p) => p.id !== pid) } : d)),
    );
  }, []);

  /* השלמה מפנקס המצרכים · המחיר האחרון נמשך איתה */
  const pickPantry = useCallback(
    (id: string, pid: number, x: PantryRow) =>
      patchPart(id, pid, { name: x.name, price: String(x.price) }),
    [patchPart],
  );

  const hitsFor = useCallback((q: string) => {
    const t = trim(q);
    if (t === '') return [];
    if (PANTRY.some((x) => x.name === t)) return [];
    return PANTRY.filter((x) => x.name.includes(t)).slice(0, MAX_HITS);
  }, []);

  /* ייבוא מרשימת קניות · כל מצרך ששמו תואם מקבל את המחיר ששולם.
     הכמות נשארת כפי שהיא — קנייה אחת מזינה כמה מנות, והכמות היא של המתכון. */
  const importBuy = useCallback((b: Buy) => {
    const price: Record<string, number> = {};
    for (const r of b.rows) price[r.n] = r.p;
    let hit = 0;
    setDishes((list) =>
      list.map((d) => ({
        ...d,
        parts: d.parts.map((p) => {
          const v = price[trim(p.name)];
          if (v === undefined) return p;
          hit++;
          return { ...p, price: String(v) };
        }),
      })),
    );
    setImpOpen(false);
    setImpDone(hit === 0 ? IMPORT.none : `${IMPORT.prefix}${hit}${IMPORT.suffix}`);
  }, []);

  const pickCat = useCallback((id: CostCatKey) => {
    setCat(id);
    setOpen('');
  }, []);
  const pickSub = useCallback((id: string) => {
    setSub(id);
    setOpen('');
  }, []);

  return {
    cat, sub, open, seen, impOpen, impDone, dishes,
    pickCat, pickSub, patch, patchPart, addPart, removePart, pickPantry, hitsFor, importBuy,
    toggle: useCallback((id: string) => setOpen((cur) => (cur === id ? '' : id)), []),
    dismissDue: useCallback(() => setSeen(true), []),
    openImp: useCallback(() => {
      setImpOpen(true);
      setImpDone('');
    }, []),
    closeImp: useCallback(() => setImpOpen(false), []),
  };
}

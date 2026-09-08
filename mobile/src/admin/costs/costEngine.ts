import { MAX_DEPTH, SALADS_AVG, type CostMode } from '../../data/adminCosts';

/** מנה כפי שהיא נערכת במסך · כל השדות מחרוזות, כי הם באים משדות קלט */
export type EditablePart = { id: number; name: string; price: string; qty: string };
export type EditableDish = {
  id: string;
  c: string;
  sub: string | null;
  name: string;
  mode: CostMode;
  note: string;
  from: { id: string; m: number }[];
  price: string;
  yld: string;
  parts: EditablePart[];
};

export const num = (v: string) => {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};
export const trim = (v: string) => String(v ?? '').trim();
export const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const money = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/** סה״כ המצרכים · מחיר כפול כמות בכל שורה */
export const partsSum = (d: EditableDish) =>
  d.parts.reduce((s, p) => s + num(p.price) * num(p.qty), 0);

/** עלות ממוצעת ל-100 גרם סלט · ממנה נגזרים המארזים */
export function saladAvg100(dishes: EditableDish[]): number {
  const list = dishes.filter((d) => d.sub === 'salads');
  if (!list.length) return 0;
  /* עומק 3 · בדיוק כמו בקנבס, כדי שלא ייווצר מעגל דרך המארזים */
  return list.reduce((s, d) => s + unitCost(d, dishes, 3), 0) / list.length;
}

/**
 * העלות ליחידה · לפי מצב החישוב.
 * weight מחזיר עלות ל-100 גרם; unit ו-auto מחזירים עלות ליחידה.
 * השאיבה מ-from רקורסיבית ומוגבלת בעומק.
 */
export function unitCost(
  d: EditableDish | undefined,
  dishes: EditableDish[],
  depth = 0,
): number {
  if (!d) return 0;
  if (depth > MAX_DEPTH) return 0;

  let base = 0;
  for (const f of d.from) {
    if (f.id === SALADS_AVG) {
      base += saladAvg100(dishes) * f.m;
      continue;
    }
    const src = dishes.find((x) => x.id === f.id);
    if (src) base += unitCost(src, dishes, depth + 1) * f.m;
  }

  const own = partsSum(d);
  const y = num(d.yld);

  if (d.mode === 'weight') return y > 0 ? own / (y / 100) : 0;
  /* כמות אפס עם מצרכים · המנה עצמה היא היחידה, בלי חלוקה */
  if (own > 0 && y > 0) base += own / y;
  else if (own > 0 && y === 0) base += own;
  return base;
}

/** בסלטים העלות היא ל-100 גרם והמחיר לק״ג · משווים באותה יחידה */
export const comparableCost = (d: EditableDish, unit: number) =>
  d.mode === 'weight' ? unit * 10 : unit;

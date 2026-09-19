import type { ProductionDish } from '@prisma/client';
import { readJson } from '../json.ts';
import { COST_DISHES } from '../../../mobile/src/data/adminCosts.ts';

/**
 * שורת מצרך במתכון.
 *
 * ⚠ **`ref` נוסף ב-19 בספטמבר 2026** · בקשה של שקד: ההרכבה צריכה
 * להופיע **כשורות מוצר ברשימה עצמה**, ולא כקישור נסתר. בלשונה:
 * ״במנת עוף · מוצר: קוסקוס ירקות, כמות 1, מחיר כמה שיצא העלות
 * ייצור בחישוב של הקוסקוס צמחוני · מוצר: עוף, כמות 1, מחיר כמה
 * שיצא בחישוב של תוספת עוף״.
 *
 * שורה עם `ref` מצביעה על **מנה אחרת**, והמחיר שלה אינו מוקלד
 * אלא **מחושב** מעלות הייצור של אותה מנה. שורה בלי `ref` היא
 * מצרך גולמי רגיל שהמחיר שלו מוקלד.
 */
export type CostPart = { n: string; price: number; qty: number; ref?: string };
export type CostFrom = { id: string; m: number };

export type DishView = {
  id: string;
  c: string;
  sub: string;
  name: string;
  mode: string;
  price: number;
  yld: number;
  note: string;
  from: CostFrom[];
  parts: CostPart[];
};

/**
 * הסדר הקנוני של המנות · לפי `adminCosts.ts`.
 *
 * ⚠ **בקשה של שקד · 19 בספטמבר 2026** · ״בעלויות ייצור תסדר שזה
 * יהיה לפי הסדר: קוסקוס צמחוני, קוסקוס עם עוף, קוסקוס עם מפרום,
 * תוספת ירקות, תוספת עוף, תוספת מפרום״.
 *
 * ⚠ **זה בדיוק הסדר שכבר קיים בקובץ המקור** · `findMany` בלי
 * `orderBy` מחזיר בסדר שרירותי של המסד, ולכן המסך הציג אותן
 * מעורבבות. אין צורך ברשימה חדשה — רק למיין לפי מה שכבר יש.
 *
 * ⚠ **מנה שאינה בקובץ יורדת לסוף** · לא נעלמת.
 */
const ORDER = new Map(COST_DISHES.map((d, i) => [d.id, i]));

export function sortDishes<T extends { id: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => (ORDER.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (ORDER.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function viewOf(row: ProductionDish): DishView {
  return {
    id: row.id,
    c: row.category,
    sub: row.sub,
    name: row.name,
    mode: row.mode,
    price: row.price,
    yld: row.yieldQty,
    note: row.note,
    from: readJson<CostFrom[]>(row.fromJson, []),
    parts: readJson<CostPart[]>(row.partsJson, []),
  };
}

/** מצרכים גולמיים בלבד · אלה שמתחלקים בתפוקה */
export function partsSum(d: DishView): number {
  return d.parts
    .filter((p) => !p.ref)
    .reduce((s, p) => s + Number(p.price) * Number(p.qty), 0);
}

/**
 * מחיר שורה · מוקלד, או מחושב כשהיא מצביעה על מנה אחרת.
 * ⚠ **לתצוגה** · המספר שמופיע בעמודת ״מחיר״ באותה שורה.
 */
export function rowPrice(p: CostPart, all: DishView[], depth = 0): number {
  if (!p.ref) return Number(p.price);
  const src = all.find((x) => x.id === p.ref);
  return src ? unitCost(src, all, depth + 1) : 0;
}

/**
 * שורות שמצביעות על מנות אחרות.
 *
 * ⚠ **לא מתחלקות בתפוקה** · מצרך גולמי נקנה למנה שלמה ומתחלק
 * במספר המנות שיוצאות ממנה. שורת הרכבה היא כבר **עלות למנה
 * אחת** של המנה שאליה היא מצביעה, ולכן היא נכנסת כמו שהיא.
 */
export function refsSum(d: DishView, all: DishView[], depth = 0): number {
  return d.parts
    .filter((p) => p.ref)
    .reduce((s, p) => s + rowPrice(p, all, depth) * Number(p.qty), 0);
}

/** סכום כל השורות · **לתצוגה בלבד** · ראו `unitCost` לחישוב האמיתי */
export function rowsSum(d: DishView, all: DishView[]): number {
  return d.parts.reduce((s, p) => s + rowPrice(p, all) * Number(p.qty), 0);
}

export function unitCost(d: DishView, all: DishView[], depth = 0): number {
  if (depth > 4) return 0;
  let base = 0;
  for (const f of d.from) {
    if (f.id === 'salads:avg') {
      base += saladAvg100(all) * f.m;
      continue;
    }
    const src = all.find((x) => x.id === f.id);
    if (src) base += unitCost(src, all, depth + 1) * f.m;
  }
  /* ⚠ שורות הרכבה · נכנסות מחוץ לחלוקה בתפוקה · ראו `refsSum` */
  base += refsSum(d, all, depth);
  const own = partsSum(d);
  const y = Number(d.yld) || 0;
  if (d.mode === 'weight') return y > 0 ? own / (y / 100) : 0;
  if (own > 0 && y > 0) base += own / y;
  else if (own > 0 && y === 0) base += own;
  return base;
}

export function saladAvg100(all: DishView[]): number {
  const list = all.filter((d) => d.sub === 'salads');
  if (!list.length) return 0;
  return list.reduce((s, d) => s + unitCost(d, all, 3), 0) / list.length;
}

export function compareCost(d: DishView, all: DishView[]): number {
  const unit = unitCost(d, all);
  return d.mode === 'weight' ? unit * 10 : unit;
}

export function menuRowsOf(all: DishView[]) {
  const skipSalads = all.filter((d) => d.sub !== 'salads');
  const salads = all.filter((d) => d.sub === 'salads');
  const rows = skipSalads.map((d) => {
    const cost = compareCost(d, all);
    return { id: d.id, c: d.c, name: d.name, price: d.price, cost };
  });
  if (salads.length) {
    const avg = salads.reduce((s, d) => s + compareCost(d, all), 0) / salads.length;
    rows.splice(
      rows.findIndex((r) => r.c === 'box'),
      0,
      { id: 'salads', c: 'box', name: 'סלטים · ק״ג', price: 89, cost: avg },
    );
  }
  return rows.filter((r) => r.c !== 'fruit');
}

import type { ProductionDish } from '@prisma/client';
import { readJson } from '../json.ts';

export type CostPart = { n: string; price: number; qty: number };
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

export function partsSum(d: DishView): number {
  return d.parts.reduce((s, p) => s + Number(p.price) * Number(p.qty), 0);
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

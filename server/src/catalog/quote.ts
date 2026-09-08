import { CITIES, PAYMENTS, SALE_DATE } from '../../../mobile/src/data/shared.ts';
import {
  COUSCOUS_FULFILLMENT,
  COUSCOUS_MENU,
  DELIVERY_MIN_MEALS,
} from '../../../mobile/src/data/couscous.ts';
import {
  COCOTTES,
  COCOTTE_PRICE,
  SCHNITZEL_FULFILLMENT,
  SCHNITZEL_TYPES,
} from '../../../mobile/src/data/schnitzel.ts';
import { FRUIT_FULFILLMENT, FRUIT_TRAYS } from '../../../mobile/src/data/fruit.ts';
import { BOXES, BOXES_FULFILLMENT, priceOfBox } from '../../../mobile/src/data/boxes.ts';
import { CHEF_FULFILLMENT, CHEF_PACKAGES, priceOfPackage } from '../../../mobile/src/data/chef.ts';
import {
  MENU,
  ROLL,
  SHIP_FEE,
  type AdminCatKey,
} from '../../../mobile/src/data/adminOrders.ts';
import { isAddressValid, toMinutes, type OrderLine } from '../../../mobile/src/order/types.ts';
import { badRequest } from '../errors.ts';

export const CATEGORIES = ['cous', 'schn', 'box', 'fruit', 'chef'] as const;
export type CategoryKey = (typeof CATEGORIES)[number];

export type Quote = {
  lines: OrderLine[];
  itemsTotal: number;
  meals: number;
  shippingFee: number;
  total: number;
};

const FULFILLMENT = {
  cous: COUSCOUS_FULFILLMENT,
  schn: SCHNITZEL_FULFILLMENT,
  box: BOXES_FULFILLMENT,
  fruit: FRUIT_FULFILLMENT,
  chef: CHEF_FULFILLMENT,
} as const;

export type CustomerDetails =
  | { category: 'cous'; qty: number[] }
  | {
      category: 'schn';
      mode: 'unit' | 'box';
      rolls: { type: number; tops: string[] }[];
      box: { type: number; tops: string[] } | null;
      cocottes: number[];
    }
  | { category: 'fruit'; qty: number[] }
  | { category: 'box'; key: string; picks: Record<string, unknown> }
  | { category: 'chef'; key: string; picks: Record<string, unknown> };

export type FulfillmentInput = {
  ship: 'self' | 'deliv';
  time: string;
  city?: string;
  address?: string;
  pay: string;
};

export function isCategory(v: string): v is CategoryKey {
  return (CATEGORIES as readonly string[]).includes(v);
}

function linesOfCouscous(qty: number[]): Quote {
  if (qty.length !== COUSCOUS_MENU.length) throw badRequest('invalid_order', 'couscous qty');
  if (qty.some((n) => !Number.isInteger(n) || n < 0)) throw badRequest('invalid_order', 'couscous qty');
  const lines: OrderLine[] = [];
  let itemsTotal = 0;
  let meals = 0;
  COUSCOUS_MENU.forEach((it, i) => {
    const n = qty[i] ?? 0;
    if (n <= 0) return;
    const sum = n * it.price;
    itemsTotal += sum;
    if (it.meal) meals += n;
    lines.push({ name: it.name, qty: n, sum });
  });
  if (itemsTotal <= 0) throw badRequest('invalid_order', 'empty');
  return { lines, itemsTotal, meals, shippingFee: 0, total: itemsTotal };
}

function assertTops(type: number, tops: string[]) {
  const spec = SCHNITZEL_TYPES[type];
  if (!spec) throw badRequest('invalid_order', 'schnitzel type');
  if (!Array.isArray(tops) || tops.some((t) => !spec.tops.includes(t))) {
    throw badRequest('invalid_order', 'schnitzel tops');
  }
}

function linesOfSchnitzel(d: Extract<CustomerDetails, { category: 'schn' }>): Quote {
  if (d.cocottes.length !== COCOTTES.length) throw badRequest('invalid_order', 'cocottes');
  if (d.cocottes.some((n) => !Number.isInteger(n) || n < 0)) throw badRequest('invalid_order', 'cocottes');

  const lines: OrderLine[] = [];
  let itemsTotal = 0;

  if (d.mode === 'unit') {
    if (!d.rolls.length && d.cocottes.every((n) => n === 0)) throw badRequest('invalid_order', 'empty');
    d.rolls.forEach((r, i) => {
      assertTops(r.type, r.tops);
      const spec = SCHNITZEL_TYPES[r.type];
      itemsTotal += spec.unit;
      lines.push({ qty: 1, name: `חלה ${i + 1} · ${spec.short}`, sum: spec.unit });
    });
  } else {
    if (!d.box) throw badRequest('invalid_order', 'empty box');
    assertTops(d.box.type, d.box.tops);
    const spec = SCHNITZEL_TYPES[d.box.type];
    itemsTotal += spec.box;
    lines.push({ qty: 1, name: `מארז · ${spec.short}`, sum: spec.box });
  }

  d.cocottes.forEach((n, i) => {
    if (n <= 0) return;
    const sum = n * COCOTTE_PRICE;
    itemsTotal += sum;
    lines.push({ qty: n, name: `קוקוט ${COCOTTES[i]}`, sum });
  });

  if (itemsTotal <= 0) throw badRequest('invalid_order', 'empty');
  return { lines, itemsTotal, meals: 0, shippingFee: 0, total: itemsTotal };
}

function linesOfFruit(qty: number[]): Quote {
  if (qty.length !== FRUIT_TRAYS.length) throw badRequest('invalid_order', 'fruit qty');
  if (qty.some((n) => !Number.isInteger(n) || n < 0)) throw badRequest('invalid_order', 'fruit qty');
  const lines: OrderLine[] = [];
  let itemsTotal = 0;
  FRUIT_TRAYS.forEach((t, i) => {
    const n = qty[i] ?? 0;
    if (n <= 0) return;
    const sum = n * t.price;
    itemsTotal += sum;
    lines.push({ name: t.name, qty: n, sum });
  });
  if (itemsTotal <= 0) throw badRequest('invalid_order', 'empty');
  return { lines, itemsTotal, meals: 0, shippingFee: 0, total: itemsTotal };
}

function linesOfBox(key: string, picks: Record<string, unknown>): Quote {
  const box = BOXES.find((b) => b.key === key);
  if (!box) throw badRequest('invalid_order', 'box key');
  const itemsTotal = priceOfBox(box, picks);
  if (!Number.isFinite(itemsTotal) || itemsTotal <= 0) throw badRequest('invalid_order', 'box price');
  const lines: OrderLine[] = [{ qty: 1, name: box.name, sum: itemsTotal }];
  return { lines, itemsTotal, meals: 0, shippingFee: 0, total: itemsTotal };
}

function linesOfChef(key: string, picks: Record<string, unknown>): Quote {
  const pkg = CHEF_PACKAGES.find((p) => p.key === key);
  if (!pkg) throw badRequest('invalid_order', 'chef key');
  const itemsTotal = priceOfPackage(pkg, picks);
  if (!Number.isFinite(itemsTotal) || itemsTotal <= 0) throw badRequest('invalid_order', 'chef price');
  const guests = Number(picks.guests || 1);
  const lines: OrderLine[] = [{ qty: guests || 1, name: pkg.name, sum: itemsTotal }];
  return { lines, itemsTotal, meals: 0, shippingFee: 0, total: itemsTotal };
}

export function quoteCustomer(details: CustomerDetails): Quote {
  switch (details.category) {
    case 'cous':
      return linesOfCouscous(details.qty);
    case 'schn':
      return linesOfSchnitzel(details);
    case 'fruit':
      return linesOfFruit(details.qty);
    case 'box':
      return linesOfBox(details.key, details.picks);
    case 'chef':
      return linesOfChef(details.key, details.picks);
  }
}

export function assertFulfillment(category: CategoryKey, meals: number, f: FulfillmentInput) {
  const cfg = FULFILLMENT[category];
  if (f.ship !== 'self' && f.ship !== 'deliv') throw badRequest('invalid_order', 'ship');
  if (!(PAYMENTS as readonly string[]).includes(f.pay)) throw badRequest('invalid_order', 'pay');

  const minutes = toMinutes(f.time);
  if (minutes === null) throw badRequest('invalid_order', 'time');

  if (f.ship === 'self') {
    if (minutes < cfg.pickupFrom || minutes > cfg.pickupTo) throw badRequest('invalid_order', 'pickup window');
  } else {
    const min = 'minMealsForDelivery' in cfg ? cfg.minMealsForDelivery : undefined;
    if (min !== undefined && meals < min) throw badRequest('invalid_order', 'delivery min');
    if (category === 'cous' && meals < DELIVERY_MIN_MEALS) throw badRequest('invalid_order', 'delivery min');
    if (!cfg.deliverySlots.includes(f.time)) throw badRequest('invalid_order', 'delivery slot');
    if (!f.city || !(CITIES as readonly string[]).includes(f.city)) throw badRequest('invalid_order', 'city');
    if (!isAddressValid(f.address ?? '')) throw badRequest('invalid_order', 'address');
  }
}

export function defaultSaleDate(v?: string) {
  return (v && v.trim()) || SALE_DATE;
}

/** הזמנה ידנית ממסך הניהול · אותם מחירונים שחולצו ל-adminOrders.ts */
export type AdminDraft = {
  category: AdminCatKey;
  qty: Record<string, number>;
  rolls: { type: string; tops: string[] }[];
  ship: 'self' | 'deliv' | 'pickup';
  area: string;
  address: string;
  time: string;
  applyShipping: boolean;
};

export function quoteAdminDraft(d: AdminDraft): Quote {
  const menu = MENU[d.category] ?? [];
  const lines: OrderLine[] = [];
  let itemsTotal = 0;
  let meals = 0;

  for (const it of menu) {
    const n = d.qty[it.id] ?? 0;
    if (!Number.isInteger(n) || n < 0) throw badRequest('invalid_order', 'qty');
    if (n <= 0) continue;
    const sum = n * it.price;
    itemsTotal += sum;
    if (['veg', 'chick', 'mafr'].includes(it.id)) meals += n;
    lines.push({ name: it.n, qty: n, sum });
  }

  if (d.category === 'schn') {
    for (const r of d.rolls) {
      const spec = ROLL[r.type];
      if (!spec) throw badRequest('invalid_order', 'roll');
      if (r.tops.some((t) => !spec.tops.includes(t))) throw badRequest('invalid_order', 'roll tops');
      itemsTotal += spec.price;
      const tops = r.tops.length ? ` (${r.tops.join(', ')})` : ' (בלי תוספות)';
      lines.push({ name: spec.n + tops, qty: 1, sum: spec.price });
    }
  }

  if (itemsTotal <= 0) throw badRequest('invalid_order', 'empty');

  const isDeliv = d.ship === 'deliv';
  if (isDeliv && d.category === 'cous' && meals < DELIVERY_MIN_MEALS) {
    throw badRequest('invalid_order', 'delivery min');
  }
  if (isDeliv && !d.address.trim()) throw badRequest('invalid_order', 'address');

  const shippingFee = d.applyShipping && isDeliv ? (SHIP_FEE[d.area] ?? SHIP_FEE['אחר'] ?? 0) : 0;
  return { lines, itemsTotal, meals, shippingFee, total: itemsTotal + shippingFee };
}

export function itemsLine(lines: OrderLine[]): string {
  return lines.map((l) => `${l.qty} × ${l.name}`).join(' · ');
}

export function shipLabel(ship: string, address: string, city: string): string {
  if (ship === 'deliv') {
    const loc = [address, city].filter(Boolean).join(', ');
    return loc ? `משלוח · ${loc}` : 'משלוח';
  }
  return 'איסוף עצמי';
}

export function hoursUntil(time: string): number {
  const m = toMinutes(time);
  if (m === null) return 24;
  const now = new Date();
  const target = new Date(now);
  target.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return (target.getTime() - now.getTime()) / 36e5;
}

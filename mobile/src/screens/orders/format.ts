import { CATEGORIES } from '../../data/categories';
import { count } from '../../text/counts';
import { CANCELLED, FLOW } from '../../data/adminOrders';
import type { Order } from '../../api/types';
import type { CategoryKey } from '../../theme/tokens';

const LIVE = new Set([...FLOW.filter((s) => s !== 'נמסרה'), 'מאושרת']);

export const isLive = (status: string) => LIVE.has(status);
export const isCancelled = (status: string) => status === CANCELLED || status.startsWith('בוטל');

export function categoryName(key: string): string {
  const cat = CATEGORIES.find((c) => c.key === key);
  return cat?.sub ?? cat?.title ?? key;
}

export function categoryKey(key: string): CategoryKey {
  return (CATEGORIES.find((c) => c.key === key)?.key ?? 'cous') as CategoryKey;
}

export function itemsLine(order: Order): string {
  return order.lines.map((l) => `${l.qty} × ${l.name}`).join(' · ');
}

export function shipWord(ship: string): string {
  return ship === 'deliv' ? 'משלוח' : 'איסוף';
}

/** שורת המועד · איסוף/משלוח, תאריך ושעה */
export function whenLine(order: Order): string {
  const ship = shipWord(order.ship);
  const bits = [order.saleDate, order.time].filter(Boolean);
  return bits.length ? `${ship} · ${bits.join(', ')}` : ship;
}

export function shortRef(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
}

export function countLabel(live: number, past: number): string {
  return live
    ? `${live} פעילה · ${past} קודמות`
    : count(past, 'הזמנה קודמת אחת', 'הזמנות קודמות');
}

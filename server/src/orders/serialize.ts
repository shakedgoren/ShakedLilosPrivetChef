import type { Order } from '@prisma/client';
import { hoursUntil, itemsLine, shipLabel } from '../catalog/quote.ts';
import type { OrderLine } from '../../../mobile/src/order/types.ts';

export function parseLines(json: string): OrderLine[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function serializeOrder(row: Order) {
  const lines = parseLines(row.itemsJson);
  return {
    id: row.id,
    category: row.category,
    status: row.status,
    name: row.name,
    phone: row.phone,
    ship: row.ship,
    time: row.time,
    city: row.city,
    address: row.address,
    pay: row.pay,
    saleDate: row.saleDate,
    via: row.via,
    lines,
    itemsTotal: row.itemsTotal,
    shippingFee: row.shippingFee,
    total: row.total,
    cancelReason: row.cancelReason,
    cancelNote: row.cancelNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
  };
}

/** צורת הכרטיס במסך ניהול הזמנות */
export function serializeAdminCard(row: Order) {
  const lines = parseLines(row.itemsJson);
  return {
    id: row.id,
    key: row.category,
    status: row.status,
    who: row.name,
    phone: row.phone,
    time: row.time,
    items: itemsLine(lines),
    sum: row.total,
    ship: shipLabel(row.ship, row.address, row.city),
    pay: row.pay,
    via: row.via,
    hrs: hoursUntil(row.time),
    cancelReason: row.cancelReason,
    cancelNote: row.cancelNote,
    saleDate: row.saleDate,
    createdAt: row.createdAt.toISOString(),
  };
}

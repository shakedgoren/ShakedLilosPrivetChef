/**
 * תבניות Utility אצל שקד · השמות כפי שנוצרו ב-Meta, כולל שגיאות הכתיב.
 * לא לתקן ל-delivery.
 */
export const META_UTILITY_TEMPLATES = {
  confirmPickup: 'order_pickup_confirmed',
  confirmDelivery: 'order_delivary_confirmed',
  readyPickup: 'order_pick_up',
  delivered: 'order_dalivery',
} as const;

/**
 * פרמטרי גוף · מה שידוע: {{1}} = שם הלקוחה.
 *
 * {{2}}… עדיין לא ידועים. אם Meta דוחה בגלל מספר פרמטרים,
 * להוסיף מפתחות ל-`UTILITY_BODY_KEYS` מהרשימה ב-`orderUtilitySlots`
 * (orderId, total, timeOrAddress) — בלי לגעת בנתיבי השליחה.
 */
export const UTILITY_BODY_KEYS = ['name'] as const;

export type UtilitySlot = 'name' | 'orderId' | 'total' | 'timeOrAddress';

export type OrderTemplateSlots = {
  name: string;
  id: string;
  total: number;
  ship: string;
  time: string;
  city: string;
  address: string;
};

export type UtilityKind = 'confirmPickup' | 'confirmDelivery' | 'readyPickup' | 'delivered';

export function isDeliveryShip(ship: string): boolean {
  return ship === 'deliv';
}

export function timeOrAddress(order: {
  ship: string;
  time: string;
  city: string;
  address: string;
}): string {
  const time = order.time.trim();
  if (isDeliveryShip(order.ship)) {
    const loc = [order.address.trim(), order.city.trim()].filter(Boolean).join(', ');
    if (loc && time) return `${loc} · ${time}`;
    return loc || time || 'משלוח';
  }
  return time || 'איסוף עצמי';
}

export function orderUtilitySlots(order: OrderTemplateSlots): Record<UtilitySlot, string> {
  return {
    name: order.name.trim() || '—',
    orderId: order.id,
    total: String(order.total),
    timeOrAddress: timeOrAddress(order),
  };
}

export function orderUtilityBodyParams(order: OrderTemplateSlots): string[] {
  const slots = orderUtilitySlots(order);
  return UTILITY_BODY_KEYS.map((key) => slots[key]);
}

export function confirmTemplateKind(ship: string): Extract<UtilityKind, 'confirmPickup' | 'confirmDelivery'> {
  return isDeliveryShip(ship) ? 'confirmDelivery' : 'confirmPickup';
}

/** מוכנה + איסוף → order_pick_up · נמסרה + משלוח → order_dalivery. אחרת אין תבנית. */
export function statusTemplateKind(status: string, ship: string): Extract<UtilityKind, 'readyPickup' | 'delivered'> | null {
  if (status === 'מוכנה' && !isDeliveryShip(ship)) return 'readyPickup';
  if (status === 'נמסרה' && isDeliveryShip(ship)) return 'delivered';
  return null;
}

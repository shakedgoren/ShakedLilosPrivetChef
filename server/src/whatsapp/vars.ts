/**
 * פרמטרי תבניות Utility · סדר {{n}} זמני עד שקד תשלח את הרשימה מ-Meta.
 *
 * לשנות סדר: רק את המערך `UTILITY_BODY_KEYS`.
 * {{1}} name · {{2}} orderId · {{3}} total · {{4}} timeOrAddress
 *   timeOrAddress באיסוף = שעה; במשלוח = כתובת, עיר · שעה
 */

export const UTILITY_BODY_KEYS = ['name', 'orderId', 'total', 'timeOrAddress'] as const;

export type UtilitySlot = (typeof UTILITY_BODY_KEYS)[number];

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

/** מוכנה + איסוף → מוכנה לאיסוף · נמסרה + משלוח → המשלוח הגיע. אחרת אין תבנית. */
export function statusTemplateKind(status: string, ship: string): Extract<UtilityKind, 'readyPickup' | 'delivered'> | null {
  if (status === 'מוכנה' && !isDeliveryShip(ship)) return 'readyPickup';
  if (status === 'נמסרה' && isDeliveryShip(ship)) return 'delivered';
  return null;
}

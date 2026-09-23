/**
 * תבניות Utility אצל שקד · השמות כפי שנוצרו ב-Meta, כולל שגיאות הכתיב.
 * לא לתקן ל-delivery.
 * `order_dely` מאושרת גם היא, באותו מבנה גוף כמו `order_delivary_confirmed`.
 */
export const META_UTILITY_TEMPLATES = {
  confirmPickup: 'order_pickup_confirmed',
  confirmDelivery: 'order_delivary_confirmed',
  readyPickup: 'order_pick_up',
  delivered: 'order_dalivery',
} as const;

export type UtilityKind = 'confirmPickup' | 'confirmDelivery' | 'readyPickup' | 'delivered';

export type UtilitySlot = 'name' | 'total' | 'address' | 'time';

/**
 * פרמטרי גוף לפי סוג התבנית · הסדר הוא {{1}} {{2}} …
 * מספר הפרמטרים חייב להתאים לתבנית המאושרת, אחרת Graph מחזיר #132000.
 *
 * confirmPickup   · שם, סכום, שעת איסוף          (order_pickup_confirmed)
 * confirmDelivery · שם, כתובת, סכום, שעה         (order_delivary_confirmed וגם order_dely)
 * readyPickup     · שם                            (order_pick_up)
 * delivered       · שם, כתובת                     (order_dalivery)
 */
export const UTILITY_BODY_KEYS: Record<UtilityKind, readonly UtilitySlot[]> = {
  confirmPickup: ['name', 'total', 'time'],
  confirmDelivery: ['name', 'address', 'total', 'time'],
  readyPickup: ['name'],
  delivered: ['name', 'address'],
};

export type OrderTemplateSlots = {
  name: string;
  id: string;
  total: number;
  ship: string;
  time: string;
  city: string;
  address: string;
};

export function isDeliveryShip(ship: string): boolean {
  return ship === 'deliv';
}

/** כתובת למשלוח · רחוב ואז עיר, כששניהם שמורים */
export function deliveryAddress(order: { address: string; city: string }): string {
  return [order.address.trim(), order.city.trim()].filter(Boolean).join(', ');
}

export function orderUtilitySlots(order: OrderTemplateSlots): Record<UtilitySlot, string> {
  return {
    name: order.name.trim() || '—',
    total: String(order.total),
    address: deliveryAddress(order) || '—',
    time: order.time.trim() || '—',
  };
}

export function orderUtilityBodyParams(order: OrderTemplateSlots, kind: UtilityKind): string[] {
  const slots = orderUtilitySlots(order);
  return UTILITY_BODY_KEYS[kind].map((key) => slots[key]);
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

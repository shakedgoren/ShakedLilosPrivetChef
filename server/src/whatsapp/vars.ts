/**
 * סוגי ההודעות ללקוחה, ומה כל אחת צריכה לדעת.
 *
 * ⚠ **שמות התבניות של Meta הוסרו · 8 באוקטובר 2026** · במעבר
 * ל-Green API אין יותר תבניות מאושרות, ולכן `META_UTILITY_TEMPLATES`
 * (`order_pickup_confirmed`, `order_delivary_confirmed` ושות׳,
 * כולל שגיאות הכתיב שלהן) ו-`UTILITY_BODY_KEYS` נמחקו. מה שנשאר
 * כאן הוא **ההחלטה איזו הודעה מגיעה מתי** — היא לא תלויה בספק.
 *
 * הנוסח עצמו יושב ב-`messages.ts`.
 */

export type UtilityKind = 'confirmPickup' | 'confirmDelivery' | 'readyPickup' | 'delivered';


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

export function confirmTemplateKind(ship: string): Extract<UtilityKind, 'confirmPickup' | 'confirmDelivery'> {
  return isDeliveryShip(ship) ? 'confirmDelivery' : 'confirmPickup';
}

/** מוכנה + איסוף → order_pick_up · נמסרה + משלוח → order_dalivery. אחרת אין תבנית. */
export function statusTemplateKind(status: string, ship: string): Extract<UtilityKind, 'readyPickup' | 'delivered'> | null {
  if (status === 'מוכנה' && !isDeliveryShip(ship)) return 'readyPickup';
  if (status === 'נמסרה' && isDeliveryShip(ship)) return 'delivered';
  return null;
}

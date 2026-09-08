/** מצבי מטבח · עברית כמו במסך הניהול, עם מאושרת שהתבקשה ב-MVP */
export const STATUSES = [
  'חדשה',
  'מאושרת',
  'בהכנה',
  'מוכנה',
  'נמסרה',
  'בוטלה',
] as const;

export type OrderStatus = (typeof STATUSES)[number];

const ALIASES: Record<string, OrderStatus> = {
  new: 'חדשה',
  confirmed: 'מאושרת',
  preparing: 'בהכנה',
  ready: 'מוכנה',
  delivered: 'נמסרה',
  cancelled: 'בוטלה',
  חדשה: 'חדשה',
  מאושרת: 'מאושרת',
  בהכנה: 'בהכנה',
  מוכנה: 'מוכנה',
  נמסרה: 'נמסרה',
  בוטלה: 'בוטלה',
};

export const FLOW: OrderStatus[] = ['חדשה', 'מאושרת', 'בהכנה', 'מוכנה', 'נמסרה'];
export const CANCELLED: OrderStatus = 'בוטלה';
export const DELIVERED: OrderStatus = 'נמסרה';

export function parseStatus(raw: string): OrderStatus | null {
  return ALIASES[raw] ?? null;
}

export function canAdvance(from: string, to: string): boolean {
  if (from === CANCELLED || from === DELIVERED) return false;
  if (to === CANCELLED) return from !== DELIVERED;
  const a = FLOW.indexOf(from as OrderStatus);
  const b = FLOW.indexOf(to as OrderStatus);
  return a >= 0 && b > a;
}

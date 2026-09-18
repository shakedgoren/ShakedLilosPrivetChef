import { api } from './client';
import type { AdminCard, CreateOrderBody, Order } from './types';

export const createOrder = (body: CreateOrderBody) =>
  api<{ order: Order }>('/orders', { body });

export const reorderOrder = (id: string, body: Partial<CreateOrderBody> = {}) =>
  api<{ order: Order; from: string }>(`/orders/${id}/reorder`, { body });

export const listMyOrders = () => api<{ orders: Order[] }>('/orders');

/** האם יום המכירה של הקטגוריה פתוח · נבדק לפני ״להזמין שוב״ */
/**
 * שלושת מצבי יום המכירה · ראו `saleDayState` בשרת.
 * ⚠ `state` אופציונלי · שרת ישן שעדיין לא עודכן מחזיר `open` בלבד.
 */
/**
 * ⚠ **`closed` החליף את `sold_out` · 18 בספטמבר 2026** · שקד:
 * ״מהרגע שאני סוגרת את המכירה … יופיע הכיתוב ׳המכירה נסגרה׳״.
 * הסגירה היא פעולה שלה ולא תוצאה של המלאי · ראו `SaleState`
 * בשרת.
 */
export type SaleState = 'open' | 'pending' | 'closed';

export const saleDayStatus = (category: string) =>
  api<{
    category: string;
    date: string;
    open: boolean;
    state?: SaleState;
    /** האם המשתמשת כבר ביקשה תזכורת · ראו `/orders/remind` */
    reminder?: boolean;
    /**
     * מזהי המנות שאזלו · **בלי מספרים** · ראו `order/stock.ts`.
     * ⚠ אופציונלי · שרת ישן שעדיין לא עודכן אינו מחזיר את השדה.
     */
    soldOut?: string[];
    reason: string;
    message: string;
  }>(
    `/orders/sale-day?category=${encodeURIComponent(category)}`,
    { method: 'GET' },
  );

/** התזכורת מגיעה כהתראה בתוך האפליקציה · החלטה של שקד */
export const requestSaleReminder = (category: string) =>
  api<{ ok: true }>('/orders/remind', { body: { category } });

/** ביטול תזכורת · בקשה של שקד מ-17 בספטמבר 2026 */
export const cancelSaleReminder = (category: string) =>
  api<{ ok: true }>(`/orders/remind?category=${encodeURIComponent(category)}`, {
    method: 'DELETE',
  });

export type SaleNotification = { category: string; date: string };

/** ההתראות הפתוחות · ימי מכירה שנפתחו ושביקשו עליהם תזכורת */
export const listNotifications = () =>
  api<{ notifications: SaleNotification[] }>('/orders/notifications', { method: 'GET' });

export const markNotificationSeen = (category: string, date: string) =>
  api<{ ok: true }>('/orders/notifications/seen', { body: { category, date } });

export const getOrder = (id: string) => api<{ order: Order }>(`/orders/${id}`);

/**
 * הזמנות הניהול.
 *
 * ⚠ **`date` ו-`limit` נוספו ב-18 בספטמבר 2026** · בקשה של שקד:
 * ״בעמוד ההזמנות לראות רק את ההזמנות הפתוחות שקשורות לאותה המכירה
 * הנוכחית. את כל השאר שיהיו בהיסטוריית הזמנות״.
 *
 * ⚠ **כולם אופציונליים** · בלי אף אחד מהם התשובה זהה למה שהייתה,
 * ולכן שום קורא קיים לא נשבר.
 */
export const adminListOrders = (query?: {
  status?: string;
  category?: string;
  q?: string;
  /** יום מכירה יחיד · `saleDate` בשרת */
  date?: string;
  /** כמה להחזיר · בלעדיו הכל, כמו קודם */
  limit?: number;
  /** כמה לדלג · העימוד בתוך יום מכירה אחד */
  skip?: number;
  /**
   * רק מה שעדיין דורש עבודה · לא נמסרה ולא בוטלה.
   * ⚠ **סטטוס מפורש גובר עליו** · שניהם מסננים את אותו שדה.
   */
  open?: boolean;
}) => {
  const sp = new URLSearchParams();
  if (query?.status) sp.set('status', query.status);
  if (query?.category) sp.set('category', query.category);
  if (query?.q) sp.set('q', query.q);
  if (query?.date) sp.set('date', query.date);
  if (query?.limit) sp.set('limit', String(query.limit));
  if (query?.skip) sp.set('skip', String(query.skip));
  if (query?.open) sp.set('open', '1');
  const q = sp.toString();
  return api<{ orders: Order[]; cards: AdminCard[]; total?: number }>(
    `/admin/orders${q ? `?${q}` : ''}`,
  );
};

/** יום מכירה בהיסטוריה · שורה אחת ליום, לא הזמנה */
export type SaleDaySummary = { category: string; date: string; orders: number };

/**
 * היסטוריית ההזמנות · **ימי מכירה בלבד**.
 * ⚠ זו הנקודה שמייתרת עימוד במסך הראשי: במקום אלפי הזמנות נשלחת
 * שורה אחת לכל יום מכירה, וההזמנות נטענות רק כשפותחים תאריך.
 */
export const adminOrderHistory = (category?: string) =>
  api<{ days: SaleDaySummary[] }>(
    `/admin/orders/history${category ? `?category=${encodeURIComponent(category)}` : ''}`,
  );

export const adminGetOrder = (id: string) =>
  api<{ order: Order; card: AdminCard }>(`/admin/orders/${id}`);

export const adminSetStatus = (id: string, status: string, extra?: { reason?: string; note?: string }) =>
  api<{ order: Order; card: AdminCard }>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: { status, ...extra },
  });

export const adminCreateOrder = (body: {
  category: string;
  name: string;
  phone: string;
  ship: 'self' | 'deliv' | 'pickup';
  area?: string;
  address?: string;
  time: string;
  pay?: string;
  qty?: Record<string, number>;
  rolls?: { type: string; tops: string[] }[];
  saleDate?: string;
}) => api<{ order: Order; card: AdminCard }>('/admin/orders', { body });

/**
 * רישום אסימון הדחיפה של המכשיר.
 * ⚠ ראו `lib/push.ts` · השרת שומר אותו לפי אסימון ולא לפי משתמשת.
 */
export const registerPushToken = (token: string, platform: string) =>
  api<{ ok: true }>('/orders/push-token', { body: { token, platform } });

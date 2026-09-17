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
export type SaleState = 'open' | 'pending' | 'sold_out';

export const saleDayStatus = (category: string) =>
  api<{
    category: string;
    date: string;
    open: boolean;
    state?: SaleState;
    /** האם המשתמשת כבר ביקשה תזכורת · ראו `/orders/remind` */
    reminder?: boolean;
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

export const adminListOrders = (query?: { status?: string; category?: string; q?: string }) => {
  const sp = new URLSearchParams();
  if (query?.status) sp.set('status', query.status);
  if (query?.category) sp.set('category', query.category);
  if (query?.q) sp.set('q', query.q);
  const q = sp.toString();
  return api<{ orders: Order[]; cards: AdminCard[] }>(`/admin/orders${q ? `?${q}` : ''}`);
};

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

import { api } from './client';
import type { AdminCard, CreateOrderBody, Order } from './types';

export const createOrder = (body: CreateOrderBody) =>
  api<{ order: Order }>('/orders', { body });

export const listMyOrders = () => api<{ orders: Order[] }>('/orders');

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

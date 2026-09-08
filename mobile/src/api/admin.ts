import { api } from './client';
import type { AdminCard, AdminCustomer, Order } from './types';

export const adminListCustomers = () => api<{ customers: AdminCustomer[] }>('/admin/customers');

export const adminPatchCustomer = (id: string, note: string) =>
  api<{ customer: AdminCustomer }>(`/admin/customers/${id}`, { method: 'PATCH', body: { note } });

export const adminGetDays = (from?: string, to?: string) => {
  const sp = new URLSearchParams();
  if (from) sp.set('from', from);
  if (to) sp.set('to', to);
  const q = sp.toString();
  return api<{ days: Record<string, unknown>; open: { date: string; sale: string; label: string }[] }>(
    `/admin/days${q ? `?${q}` : ''}`,
  );
};

export const adminGetDay = (date: string) =>
  api<{
    date: string;
    rec: {
      blocked?: boolean;
      sale?: string | null;
      except?: string | null;
      open?: boolean;
      q?: Record<string, number>;
    };
  }>(`/admin/days/${date}`);

export const adminPutDay = (date: string, body: Record<string, unknown>) =>
  api<{ date: string; rec: Record<string, unknown> }>(`/admin/days/${date}`, { method: 'PUT', body });

export const adminSaleStock = () =>
  api<{
    days: {
      cat: string;
      date: string;
      name: string;
      day: string;
      hue: string;
      deep: string;
      rgb: string;
      open: boolean;
      items: { id: string; name: string; quota: number; sold: number; waste: number }[];
    }[];
  }>('/admin/stock/sale');

export const adminSetWaste = (date: string, dishId: string, waste: number) =>
  api<{ ok: boolean }>(`/admin/stock/sale/${date}/waste`, { method: 'PATCH', body: { dishId, waste } });

export type SupplyDto = { id: string; g: string; name: string; unit: string; n: number; min: number; per?: number };

export const adminListSupply = () => api<{ items: SupplyDto[] }>('/admin/stock/supply');
export const adminAddSupply = (body: Omit<SupplyDto, 'id'>) =>
  api<{ item: SupplyDto }>('/admin/stock/supply', { body });
export const adminPatchSupply = (id: string, body: Partial<SupplyDto>) =>
  api<{ item: SupplyDto }>(`/admin/stock/supply/${id}`, { method: 'PATCH', body });
export const adminDropSupply = (id: string) => api<{ ok: boolean }>(`/admin/stock/supply/${id}`, { method: 'DELETE' });

export type ShopItemDto = {
  id: string;
  g: string;
  name: string;
  unit: string;
  qty: string;
  price: string;
  done: boolean;
  actual: string;
};
export type ShopListDto = { id: string; area: string; openedAt: string; closedAt: string | null; items: ShopItemDto[] };

export const adminActiveShop = () => api<{ list: ShopListDto }>('/admin/shop/active');
export const adminPutShop = (body: { area?: string; items?: ShopItemDto[] }) =>
  api<{ list: ShopListDto }>('/admin/shop/active', { method: 'PUT', body });
export const adminCloseShop = () =>
  api<{ closed: ShopListDto; list: ShopListDto; expense: number }>('/admin/shop/active/close');
export const adminShopHistory = (area?: string) =>
  api<{ lists: ShopListDto[] }>(`/admin/shop/history${area && area !== 'all' ? `?area=${area}` : ''}`);

export const adminMoney = (period: string) =>
  api<{
    period: string;
    label: string;
    periodName: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    cats: { id: string; n: string; hue: string; deep: string; v: number; pct: number }[];
    expenseRows: { k: string; sub: string; v: number }[];
  }>(`/admin/money?period=${period}`);

export const adminMenu = () =>
  api<{ items: { id: string; c: string; name: string; price: number; cost: number }[] }>('/admin/menu');

export const adminCosts = () =>
  api<{
    dishes: {
      id: string;
      c: string;
      sub: string;
      name: string;
      mode: string;
      price: number;
      yld: number;
      note: string;
      from: { id: string; m: number }[];
      parts: { n: string; price: number; qty: number }[];
      unit: number;
      cost: number;
    }[];
  }>('/admin/costs');

export const adminPutCost = (
  id: string,
  body: { price?: number; yld?: number; parts?: { n: string; price: number; qty: number }[] },
) => api<{ dish: { id: string } }>(`/admin/costs/${id}`, { method: 'PUT', body });

export const adminImportCosts = (listId: string) =>
  api<{ hit: number; message: string }>(`/admin/costs/import/${listId}`, { method: 'POST' });

export const adminSummary = () =>
  api<{
    subtitle: string;
    isOpen: boolean;
    openDate: string;
    quotas: { key: string; date: string; name: string; hue: string; rgb: string; sold: number; quota: number; open: boolean }[];
    today: { orders: number; revenue: number };
    month: { revenue: number; expenses: number; profit: number };
    badges: Record<string, number | string | boolean>;
    donut: { total: number; shares: { name: string; color: string; v: number }[] };
  }>('/admin/summary');

export const adminBoard = (date?: string) => {
  const q = date ? `?date=${date}&category=cous` : '?category=cous';
  return api<{
    orders: Order[];
    cards: AdminCard[];
    qty: Record<string, Record<string, number>>;
    cancelled: number;
  }>(`/admin/board${q}`);
};

export const adminSetQty = (id: string, qty: Record<string, number>) =>
  api<{ order: Order; card: AdminCard; qty: Record<string, number> }>(`/admin/orders/${id}/qty`, {
    method: 'PATCH',
    body: { qty },
  });

export const adminSetBoardStatus = (id: string, status: string, extra?: { reason?: string; note?: string }) =>
  api<{ order: Order; card: AdminCard }>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: { status, board: true, ...extra },
  });

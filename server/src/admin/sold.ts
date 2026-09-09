import { CATS, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { MENU } from '../../../mobile/src/data/adminOrders.ts';
import { COUSCOUS_MENU } from '../../../mobile/src/data/couscous.ts';
import type { CustomerDetails } from '../catalog/quote.ts';
import { CANCELLED } from '../catalog/status.ts';
import { readJson } from '../json.ts';
import type { Order } from '@prisma/client';

const COUS_IDS = (MENU.cous ?? []).map((it) => it.id);
const SCHN_UNIT = ['thin', 'temp'] as const;
const SCHN_BOX = ['boxThin', 'boxTemp'] as const;

export type QtyMap = Record<string, number>;

/** כמויות ממבנה ההזמנה של הלקוחה · מזהי מנות כמו ב-SaleDay.quotasJson */
export function qtyOfCustomerDetails(details: CustomerDetails): QtyMap {
  if (details.category === 'cous') {
    const out: QtyMap = {};
    details.qty.forEach((n, i) => {
      const id = COUS_IDS[i];
      if (id && Number.isFinite(n) && n > 0) out[id] = n;
    });
    return out;
  }
  if (details.category === 'schn') {
    const out: QtyMap = {};
    if (details.mode === 'unit') {
      for (const r of details.rolls) {
        const id = SCHN_UNIT[r.type];
        if (id) out[id] = (out[id] ?? 0) + 1;
      }
    } else if (details.box) {
      const id = SCHN_BOX[details.box.type];
      if (id) out[id] = (out[id] ?? 0) + 1;
    }
    return out;
  }
  return {};
}

/** כמה נמכר מכל מנה ביום · מה-qty שבפרטי ההזמנה, או לפי שמות השורות */
export function qtyOfOrder(row: Order): QtyMap {
  const details = readJson<Record<string, unknown>>(row.detailsJson, {});
  if (details.category === 'cous' || details.category === 'schn') {
    const parsed = details as CustomerDetails;
    try {
      const fromDetails = qtyOfCustomerDetails(parsed);
      if (Object.keys(fromDetails).length) return fromDetails;
    } catch {
      /* fall through */
    }
  }
  const qty = details.qty;
  if (qty && typeof qty === 'object' && !Array.isArray(qty)) {
    const out: QtyMap = {};
    for (const [k, v] of Object.entries(qty as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = n;
    }
    return out;
  }
  if (Array.isArray(qty) && row.category === 'cous') {
    const out: QtyMap = {};
    qty.forEach((n, i) => {
      const id = COUS_IDS[i];
      const num = Number(n);
      if (id && Number.isFinite(num) && num > 0) out[id] = num;
    });
    return out;
  }

  const lines = readJson<{ name: string; qty: number }[]>(row.itemsJson, []);
  const dishes = CATS[row.category as DayCatKey]?.dishes ?? [];
  const out: QtyMap = {};
  for (const line of lines) {
    const dish = dishes.find((d) => d.n === line.name) ?? (MENU.cous ?? []).find((d) => d.n === line.name);
    if (!dish) continue;
    const id = 'id' in dish ? dish.id : '';
    if (!id) continue;
    out[id] = (out[id] ?? 0) + (line.qty || 0);
  }
  if (Object.keys(out).length === 0 && row.category === 'cous') {
    lines.forEach((line) => {
      const i = COUSCOUS_MENU.findIndex((m) => m.name === line.name);
      if (i >= 0) out[COUS_IDS[i]] = (out[COUS_IDS[i]] ?? 0) + line.qty;
    });
  }
  return out;
}

export function soldByDish(orders: Order[], category: string, saleDate: string): QtyMap {
  const out: QtyMap = {};
  for (const row of orders) {
    if (row.category !== category) continue;
    if (row.saleDate !== saleDate) continue;
    if (row.status === CANCELLED) continue;
    const q = qtyOfOrder(row);
    for (const [id, n] of Object.entries(q)) out[id] = (out[id] ?? 0) + n;
  }
  return out;
}

export function hebrewDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const dow = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][date.getDay()];
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return `${dow} · ${d} ב${months[m - 1]}`;
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function hebrewMonthYear(d: Date): string {
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

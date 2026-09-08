import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LOW_LEFT,
  OPEN_DAYS,
  PACKED,
  STATE_LABELS,
  SUPPLY,
  SUP_GROUPS,
  type SupplyItem,
} from '../../data/adminStock';
import { apiEnabled } from '../../api/config';
import {
  adminAddSupply,
  adminDropSupply,
  adminListSupply,
  adminPatchSupply,
  adminSaleStock,
  adminSetWaste,
  type SupplyDto,
} from '../../api/admin';
import { useNav } from '../../navigation/store';

export type StockTab = 'sale' | 'supply';
export type SupplyRow = SupplyItem & { id: number | string };
export type NewItem = { name: string; g: string; unit: string; qty: string; min: string; per: string };

const emptyItem = (g: string, unit: string): NewItem => ({
  name: '',
  g,
  unit,
  qty: '',
  min: '',
  per: '',
});

const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};
const trim = (v: string) => String(v ?? '').trim();
export const isPacked = (unit: string) => PACKED.includes(unit);

type SaleDayLive = {
  cat: string;
  date?: string;
  name: string;
  day: string;
  hue: string;
  deep: string;
  rgb: string;
  open: boolean;
  items: { id?: string; name: string; quota: number; sold: number; waste?: number }[];
};

export function useAdminStock() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [tab, setTab] = useState<StockTab>('sale');
  const [waste, setWaste] = useState<Record<string, number>>({});
  const [saleDays, setSaleDays] = useState<SaleDayLive[]>(OPEN_DAYS);
  const [supply, setSupply] = useState<SupplyRow[]>(() => SUPPLY.map((x, i) => ({ ...x, id: i })));
  const [nextId, setNextId] = useState(SUPPLY.length);
  const [sent, setSent] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<NewItem>(() => emptyItem(SUP_GROUPS[0], 'יחידה'));

  const reload = useCallback(async () => {
    if (!live) return;
    const [sale, items] = await Promise.all([adminSaleStock(), adminListSupply()]);
    setSaleDays(sale.days);
    const w: Record<string, number> = {};
    for (const d of sale.days) {
      d.items.forEach((it) => {
        w[`${d.cat}:${it.id}`] = it.waste;
      });
    }
    setWaste(w);
    setSupply(items.items.map((x: SupplyDto) => ({ id: x.id, g: x.g, name: x.name, n: x.n, unit: x.unit, min: x.min, per: x.per })));
  }, [live]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const bumpWaste = useCallback(
    (key: string, room: number, delta: number) => {
      const next = Math.min(room, Math.max(0, (waste[key] ?? 0) + delta));
      setWaste((w) => ({ ...w, [key]: next }));
      if (live) {
        const [cat, dishId] = key.split(':');
        const day = saleDays.find((d) => d.cat === cat);
        if (day?.date && dishId) void adminSetWaste(day.date, dishId, next).catch(() => undefined);
      }
    },
    [waste, live, saleDays],
  );

  const bumpSupply = useCallback(
    (id: number | string, delta: number) => {
      setSupply((list) => list.map((x) => (x.id === id ? { ...x, n: Math.max(0, x.n + delta) } : x)));
      setSent(false);
      if (live && typeof id === 'string') {
        const row = supply.find((x) => x.id === id);
        if (row) void adminPatchSupply(id, { n: Math.max(0, row.n + delta) }).catch(() => undefined);
      }
    },
    [live, supply],
  );

  const dropItem = useCallback(
    (id: number | string) => {
      setSupply((list) => list.filter((x) => x.id !== id));
      setSent(false);
      if (live && typeof id === 'string') void adminDropSupply(id).catch(() => undefined);
    },
    [live],
  );

  const setField = useCallback(
    <K extends keyof NewItem>(k: K, v: NewItem[K]) => setDraft((d) => ({ ...d, [k]: v })),
    [],
  );

  const addReady = (() => {
    if (trim(draft.name) === '' || trim(draft.min) === '') return false;
    if (isPacked(draft.unit) && num(draft.per) <= 0) return false;
    return true;
  })();

  const saveAdd = useCallback(() => {
    if (!addReady) return;
    const body = {
      g: draft.g,
      name: trim(draft.name),
      unit: draft.unit,
      per: isPacked(draft.unit) ? Math.round(num(draft.per)) : 0,
      n: Math.round(num(draft.qty)),
      min: Math.round(num(draft.min)),
    };
    if (live) {
      void adminAddSupply(body).then(reload).catch(() => undefined);
      setAddOpen(false);
      setDraft(emptyItem(draft.g, draft.unit));
      setSent(false);
      return;
    }
    setSupply((list) => [...list, { id: nextId, ...body }]);
    setNextId((i) => i + 1);
    setAddOpen(false);
    setDraft(emptyItem(draft.g, draft.unit));
    setSent(false);
  }, [addReady, draft, nextId, live, reload]);

  const days = useMemo(
    () =>
      saleDays.map((d) => {
        const rows = d.items.map((it, i) => {
          const key = `${d.cat}:${it.id ?? i}`;
          const dropped = waste[key] ?? it.waste ?? 0;
          const left = it.quota - it.sold - dropped;
          const room = it.quota - it.sold;
          const isOut = left <= 0;
          const isLow = !isOut && left <= LOW_LEFT;
          return {
            key,
            name: it.name,
            left,
            room,
            waste: dropped,
            soldLabel: `נמכרו ${it.sold} מתוך ${it.quota}` + (dropped > 0 ? ` · ירדו ${dropped}` : ''),
            state: isOut ? STATE_LABELS.out : isLow ? STATE_LABELS.low : STATE_LABELS.ok,
            fg: isOut ? '#B95349' : isLow ? '#A65E2A' : d.deep,
            barColor: isOut ? '#B95349' : isLow ? '#C77D3E' : null,
            fill: (it.sold + dropped) / it.quota,
            dropSub: dropped > 0 ? 'ירדו מהמכירה היום' : 'נפילה, שריפה או טעות',
          };
        });
        return { ...d, rows, left: rows.reduce((s, r) => s + Math.max(0, r.left), 0) };
      }),
    [saleDays, waste],
  );

  const lowItems = supply.filter((x) => x.n < x.min);
  const groups = useMemo(
    () => SUP_GROUPS.map((g) => ({ name: g, items: supply.filter((x) => x.g === g) })).filter((g) => g.items.length > 0),
    [supply],
  );

  return {
    tab, setTab, days, groups, lowItems, supply, sent, addOpen, draft, addReady,
    leftAll: days.reduce((s, d) => s + d.left, 0),
    bumpWaste, bumpSupply, dropItem, setField, saveAdd,
    openAdd: useCallback(() => setAddOpen(true), []),
    closeAdd: useCallback(() => setAddOpen(false), []),
    sendToShopping: useCallback(() => setSent(true), []),
  };
}

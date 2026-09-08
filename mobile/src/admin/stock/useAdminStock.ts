import { useCallback, useMemo, useState } from 'react';
import {
  LOW_LEFT,
  OPEN_DAYS,
  PACKED,
  STATE_LABELS,
  SUPPLY,
  SUP_GROUPS,
  type SupplyItem,
} from '../../data/adminStock';

export type StockTab = 'sale' | 'supply';

/** פריט לוגיסטי עם מזהה יציב · הרשימה נערכת, אז אי אפשר להישען על האינדקס */
export type SupplyRow = SupplyItem & { id: number };

/** טיוטת הפריט החדש */
export type NewItem = {
  name: string;
  g: string;
  unit: string;
  qty: string;
  min: string;
  per: string;
};

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

export function useAdminStock() {
  const [tab, setTab] = useState<StockTab>('sale');
  /* מנות שירדו מהמכירה אחרי שנפתחה · נפילה, שריפה, טעות.
     המפתח הוא <cat>:<index> כדי שיעבוד גם כששני ימים פתוחים יחד */
  const [waste, setWaste] = useState<Record<string, number>>({});
  const [supply, setSupply] = useState<SupplyRow[]>(() =>
    SUPPLY.map((x, i) => ({ ...x, id: i })),
  );
  const [nextId, setNextId] = useState(SUPPLY.length);
  const [sent, setSent] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<NewItem>(() => emptyItem(SUP_GROUPS[0], 'יחידה'));

  /* תיקון מלאי המכירה · לא נוגעים במכסה ולא בהזמנות, רושמים רק מה ירד */
  const bumpWaste = useCallback((key: string, room: number, delta: number) => {
    setWaste((w) => ({ ...w, [key]: Math.min(room, Math.max(0, (w[key] ?? 0) + delta)) }));
  }, []);

  const bumpSupply = useCallback((id: number, delta: number) => {
    setSupply((list) =>
      list.map((x) => (x.id === id ? { ...x, n: Math.max(0, x.n + delta) } : x)),
    );
    setSent(false);
  }, []);

  const dropItem = useCallback((id: number) => {
    setSupply((list) => list.filter((x) => x.id !== id));
    setSent(false);
  }, []);

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
    setSupply((list) => [
      ...list,
      {
        id: nextId,
        g: draft.g,
        name: trim(draft.name),
        unit: draft.unit,
        per: isPacked(draft.unit) ? Math.round(num(draft.per)) : 0,
        n: Math.round(num(draft.qty)),
        min: Math.round(num(draft.min)),
      },
    ]);
    setNextId((i) => i + 1);
    setAddOpen(false);
    setDraft(emptyItem(draft.g, draft.unit));
    setSent(false);
  }, [addReady, draft, nextId]);

  /* ── מלאי המכירה · יום אחד או יותר, לפי מה שפתוח ── */
  const days = useMemo(
    () =>
      OPEN_DAYS.map((d) => {
        const rows = d.items.map((it, i) => {
          const key = `${d.cat}:${i}`;
          const dropped = waste[key] ?? 0;
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
            soldLabel:
              `נמכרו ${it.sold} מתוך ${it.quota}` + (dropped > 0 ? ` · ירדו ${dropped}` : ''),
            state: isOut ? STATE_LABELS.out : isLow ? STATE_LABELS.low : STATE_LABELS.ok,
            fg: isOut ? '#B95349' : isLow ? '#A65E2A' : d.deep,
            barColor: isOut ? '#B95349' : isLow ? '#C77D3E' : null,
            fill: (it.sold + dropped) / it.quota,
            dropSub: dropped > 0 ? 'ירדו מהמכירה היום' : 'נפילה, שריפה או טעות',
          };
        });
        return {
          ...d,
          rows,
          left: rows.reduce((s, r) => s + Math.max(0, r.left), 0),
        };
      }),
    [waste],
  );

  const lowItems = supply.filter((x) => x.n < x.min);

  const groups = useMemo(
    () =>
      SUP_GROUPS.map((g) => ({
        name: g,
        items: supply.filter((x) => x.g === g),
      })).filter((g) => g.items.length > 0),
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

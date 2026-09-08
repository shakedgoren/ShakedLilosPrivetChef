import { useCallback, useMemo, useState } from 'react';
import {
  CATS,
  FLOW,
  LOW_STOCK,
  SEED,
  START_MODE,
  toMin,
  type BoardOrder,
} from '../../data/adminBoard';

export type BoardMode = 'all' | 'pickup' | 'deliv';
export type CancelNote = { reason: string; note: string };

/** הזמנה בלוח · עם דגל יציאה ותיעוד הביטול */
export type BoardRow = BoardOrder & { gone: boolean; why?: CancelNote };

const EMPTY_CX: CancelNote = { reason: '', note: '' };

export function useAdminBoard() {
  const [mode, setMode] = useState<BoardMode>(START_MODE as BoardMode);
  /* עותק עמוק · כדי שעדכון כמות לא ידרוס את נתוני הזרע */
  const [orders, setOrders] = useState<BoardRow[]>(() =>
    SEED.map((o) => ({ ...o, q: { ...o.q }, gone: false })),
  );
  const [cancelling, setCancelling] = useState(-1);
  const [cx, setCx] = useState<CancelNote>(EMPTY_CX);

  const cat = CATS.cous;

  /* שינוי כמות · מקלידים את המספר החדש בתא עצמו.
     מתגלגל לסה״כ, לסכום העמודה ולמונה המלאי באותו רגע. */
  const setQty = useCallback((i: number, id: string, v: string) => {
    const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
    setOrders((list) =>
      list.map((o, k) => (k === i ? { ...o, q: { ...o.q, [id]: isNaN(n) ? 0 : Math.max(0, n) } } : o)),
    );
  }, []);

  /* סימון ישיר · לוחצים על האייקון של המצב הרצוי, קדימה או אחורה */
  const setStatus = useCallback((i: number, name: string) => {
    setOrders((list) => list.map((o, n) => (n === i ? { ...o, status: name } : o)));
  }, []);

  const askCancel = useCallback((i: number) => {
    setCancelling(i);
    setCx(EMPTY_CX);
  }, []);
  const closeCancel = useCallback(() => setCancelling(-1), []);
  const setCxField = useCallback(
    (k: keyof CancelNote, v: string) => setCx((c) => ({ ...c, [k]: v })),
    [],
  );
  const cancelReady = cx.reason !== '';

  /* ההזמנה יוצאת מהלוח · המנות חוזרות למלאי כי הספירה נגזרת מהשורות */
  const doCancel = useCallback(() => {
    if (!cancelReady) return;
    const i = cancelling;
    setOrders((list) => list.map((o, n) => (n === i ? { ...o, gone: true, why: cx } : o)));
    setCancelling(-1);
  }, [cancelReady, cancelling, cx]);

  const sumOf = useCallback(
    (o: BoardRow) => cat.items.reduce((s, it) => s + (o.q[it.id] || 0) * it.price, 0),
    [cat.items],
  );

  const live = useMemo(() => orders.filter((o) => !o.gone), [orders]);

  /* מיון · קודם לפי קבוצת מצב, ובתוכה לפי שעת האיסוף */
  const shown = useMemo(
    () =>
      live
        .map((o) => ({ o, i: orders.indexOf(o) }))
        .filter((x) => mode === 'all' || x.o.ship === mode)
        .sort((a, b) => {
          const g = FLOW.indexOf(a.o.status) - FLOW.indexOf(b.o.status);
          return g !== 0 ? g : toMin(a.o.time) - toMin(b.o.time);
        }),
    [live, orders, mode],
  );

  /* המלאי · נספר על פני כל הטאבים, כי המכסה היומית משותפת */
  const stock = useMemo(
    () =>
      cat.items
        .filter((it) => it.quota)
        .map((it) => {
          const used = live.reduce((s, o) => s + (o.q[it.id] || 0), 0);
          const left = (it.quota ?? 0) - used;
          return { key: it.sub, left, of: `מתוך ${it.quota}`, isOut: left <= 0, isLow: left <= LOW_STOCK };
        }),
    [cat.items, live],
  );

  const count = useCallback(
    (m: BoardMode) => (m === 'all' ? live.length : live.filter((o) => o.ship === m).length),
    [live],
  );

  return {
    mode, setMode, orders, cat, shown, stock, count, cancelling, cx, cancelReady,
    totals: cat.items.map((it) => shown.reduce((s, x) => s + (x.o.q[it.id] || 0), 0)),
    grand: shown.reduce((s, x) => s + sumOf(x.o), 0),
    goneCount: orders.filter((o) => o.gone).length,
    sumOf, setQty, setStatus, askCancel, closeCancel, setCxField, doCancel,
  };
}

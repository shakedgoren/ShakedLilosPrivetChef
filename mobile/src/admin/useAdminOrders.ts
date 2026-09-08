import { useCallback, useMemo, useState } from 'react';
import {
  BOOK,
  CANCELLED,
  FLOW,
  ORDERS,
  type AdminCatKey,
  type AdminOrder,
} from '../data/adminOrders';
import {
  EMPTY_DRAFT,
  isReady,
  itemsLine,
  norm,
  total,
  trim,
  type NewOrderDraft,
} from './orderMath';

/** חלונית החלה · סוג החלה, התוספות שנבחרו, ואיזו חלה נערכת (-1 = חדשה) */
export type RollPop = { type: string; tops: string[]; edit: number } | null;

export type CancelNote = { reason: string; note: string };

const EMPTY_CX: CancelNote = { reason: '', note: '' };
/** שעות ההזמנה שנפתחת ידנית · יום שלם קדימה, אף פעם לא ביטול מאוחר */
const MANUAL_ORDER_HOURS = 24;

export function useAdminOrders() {
  const [tab, setTab] = useState('הכל');
  const [open, setOpen] = useState(-1);
  /* הזמנות שקודמו ידנית · מפתח → מצב חדש */
  const [moved, setMoved] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, CancelNote>>({});
  const [extra, setExtra] = useState<AdminOrder[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState<NewOrderDraft>(EMPTY_DRAFT);
  /* איזו הזמנה בתהליך ביטול · -1 = אין */
  const [cancelling, setCancelling] = useState(-1);
  const [cx, setCx] = useState<CancelNote>(EMPTY_CX);
  const [pop, setPop] = useState<RollPop>(null);

  /* הרשימה המלאה · הזמנות ההדגמה ואחריהן הזמנות שנפתחו ידנית */
  const allOrders = useMemo(() => ORDERS.concat(extra), [extra]);

  const statusOf = useCallback(
    (i: number) => moved[i] ?? allOrders[i].status,
    [moved, allOrders],
  );

  const toggle = useCallback((i: number) => setOpen((cur) => (cur === i ? -1 : i)), []);

  const pickTab = useCallback((name: string) => {
    setTab(name);
    setOpen(-1);
  }, []);

  /* קידום למצב הבא במסלול */
  const advance = useCallback(
    (i: number) => {
      const cur = statusOf(i);
      if (cur === CANCELLED) return;
      const k = FLOW.indexOf(cur);
      if (k < 0 || k >= FLOW.length - 1) return;
      setMoved((m) => ({ ...m, [i]: FLOW[k + 1] }));
    },
    [statusOf],
  );

  /* ── ביטול ── */
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

  const doCancel = useCallback(() => {
    if (!cancelReady) return;
    const i = cancelling;
    setMoved((m) => ({ ...m, [i]: CANCELLED }));
    setNotes((n) => ({ ...n, [i]: cx }));
    setCancelling(-1);
    setOpen(i);
  }, [cancelReady, cancelling, cx]);

  /* ── ההזמנה הידנית ── */
  const setField = useCallback(
    <K extends keyof NewOrderDraft>(k: K, v: NewOrderDraft[K]) =>
      setDraft((d) => ({ ...d, [k]: v })),
    [],
  );

  /* בחירת שם מהפנקס · הטלפון והכתובת נמשכים מהרשומה */
  const pickPerson = useCallback(
    (p: { name: string; phone: string; addr: string }) =>
      setDraft((d) => ({ ...d, name: p.name, phone: p.phone, addr: p.addr })),
    [],
  );

  /* החלפת קטגוריה מאפסת את הפריטים · הרשימות לא חופפות */
  const setCat = useCallback(
    (cat: AdminCatKey) => setDraft((d) => ({ ...d, cat, qty: {}, rolls: [] })),
    [],
  );

  const bumpItem = useCallback((id: string, delta: number) => {
    setDraft((d) => {
      const qty = { ...d.qty };
      const next = Math.max(0, (qty[id] ?? 0) + delta);
      if (next === 0) delete qty[id];
      else qty[id] = next;
      return { ...d, qty };
    });
  }, []);

  /* ── חלה בודדת · נפתחת בחלונית, נשמרת עם התוספות שלה ── */
  const openRoll = useCallback((type: string) => setPop({ type, tops: [], edit: -1 }), []);
  const editRoll = useCallback(
    (i: number) => {
      const r = draft.rolls[i];
      setPop({ type: r.type, tops: [...r.tops], edit: i });
    },
    [draft.rolls],
  );
  const closeRoll = useCallback(() => setPop(null), []);
  const togglePopTop = useCallback((name: string) => {
    setPop((p) => {
      if (!p) return p;
      const on = p.tops.includes(name);
      return { ...p, tops: on ? p.tops.filter((x) => x !== name) : [...p.tops, name] };
    });
  }, []);
  const saveRoll = useCallback(() => {
    if (!pop) return;
    const row = { type: pop.type, tops: [...pop.tops] };
    setDraft((d) => ({
      ...d,
      rolls: pop.edit < 0 ? [...d.rolls, row] : d.rolls.map((x, j) => (j === pop.edit ? row : x)),
    }));
    setPop(null);
  }, [pop]);
  const dropRoll = useCallback(
    (i: number) => setDraft((d) => ({ ...d, rolls: d.rolls.filter((_, j) => j !== i) })),
    [],
  );

  /* השמירה מוסיפה את ההזמנה לרשימה · לקוחה שאינה בפנקס נפתחת עם ההזמנה */
  const saveNew = useCallback(() => {
    if (!isReady(draft)) return;
    const row: AdminOrder = {
      key: draft.cat,
      who: trim(draft.name),
      phone: draft.phone,
      items: itemsLine(draft),
      sum: total(draft),
      time: trim(draft.time) || '—',
      ship: draft.ship === 'deliv' ? `משלוח · ${trim(draft.addr)}` : 'איסוף עצמי',
      pay: 'טרם שולם',
      hrs: MANUAL_ORDER_HOURS,
      via: '',
      status: FLOW[0],
    };
    setExtra((e) => [...e, row]);
    setNewOpen(false);
    setDraft(EMPTY_DRAFT);
  }, [draft]);

  const isKnown = BOOK.some((b) => norm(b.phone) === norm(draft.phone));

  return {
    tab, open, moved, notes, extra, newOpen, draft, cancelling, cx, pop,
    allOrders, statusOf, isKnown, cancelReady,
    toggle, pickTab, advance,
    askCancel, closeCancel, setCxField, doCancel,
    openNew: useCallback(() => setNewOpen(true), []),
    closeNew: useCallback(() => setNewOpen(false), []),
    setField, pickPerson, setCat, bumpItem,
    openRoll, editRoll, closeRoll, togglePopTop, saveRoll, dropRoll,
    saveNew,
  };
}

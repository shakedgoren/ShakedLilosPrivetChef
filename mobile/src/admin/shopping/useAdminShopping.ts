import { ApiError } from '../../api/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AREA,
  DEFAULT_GROUP,
  DEFAULT_UNIT,
  GROUPS,
  MONTHS,
  PANTRY,
  SEED,
  START_AREA,
  type PantryItem,
  type ShopItem,
} from '../../data/adminShopping';
import { apiEnabled } from '../../api/config';
import { adminActiveShop, adminCloseShop, adminPutShop, type ShopItemDto } from '../../api/admin';
import { useNav } from '../../navigation/store';

export type ShopRow = ShopItem & { id: number | string };
export type NewShopItem = { name: string; g: string; unit: string; qty: string; price: string };

const emptyItem = (g: string, unit: string): NewShopItem => ({ name: '', g, unit, qty: '', price: '' });
const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};
const trim = (v: string) => String(v ?? '').trim();
const pad2 = (n: number) => String(n).padStart(2, '0');
export const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const lineSum = (x: { qty: string; price: string }) => num(x.qty) * num(x.price);
const paid = (x: ShopRow) => (x.done ? (trim(x.actual) !== '' ? num(x.actual) : lineSum(x)) : 0);
const MAX_HITS = 4;

/**
 * למה הסגירה נכשלה · בעברית, לפי הקוד שהשרת מחזיר.
 * ⚠ בלי זה הלחיצה נראתה כאילו לא קרה כלום.
 */
function closeFail(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'need_checked_item') return 'צריך לסמן לפחות פריט אחד שנקנה';
    if (e.status === 404) return 'אין רשימת קניות פתוחה לסגירה';
    if (e.status === 401 || e.status === 403) return 'צריך להתחבר כמנהלת כדי לסגור רשימה';
  }
  return 'סגירת הרשימה נכשלה · נסי שוב';
}

export function useAdminShopping() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [area, setAreaState] = useState(START_AREA);
  const [opened, setOpened] = useState(() => new Date());
  const [items, setItems] = useState<ShopRow[]>(() => SEED.map((x, i) => ({ ...x, id: i })));
  const [nextId, setNextId] = useState(SEED.length);
  const [addOpen, setAddOpen] = useState(false);
  /* למה הסגירה לא קרתה · מוצג מתחת לכפתור */
  const [closeErr, setCloseErr] = useState('');
  const [draft, setDraft] = useState<NewShopItem>(() => emptyItem(DEFAULT_GROUP, DEFAULT_UNIT));

  const persist = useCallback(
    (nextItems: ShopRow[], nextArea: string) => {
      if (!live) return;
      const body: ShopItemDto[] = nextItems.map((x) => ({
        id: String(x.id),
        g: x.g,
        name: x.name,
        unit: x.unit,
        qty: x.qty,
        price: x.price,
        done: x.done,
        actual: x.actual ?? '',
      }));
      void adminPutShop({ area: nextArea, items: body }).catch(() => undefined);
    },
    [live],
  );

  const reload = useCallback(async () => {
    if (!live) return;
    const { list } = await adminActiveShop();
    setAreaState(list.area);
    setOpened(new Date(list.openedAt));
    setItems(list.items);
  }, [live]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const setArea = useCallback(
    (id: string) => {
      setAreaState(id);
      persist(items, id);
    },
    [items, persist],
  );

  const toggle = useCallback((id: number | string) => {
    setItems((list) => {
      const next = list.map((x) => (x.id === id ? { ...x, done: !x.done } : x));
      persist(next, area);
      return next;
    });
  }, [area, persist]);

  const drop = useCallback((id: number | string) => {
    setItems((list) => {
      const next = list.filter((x) => x.id !== id);
      persist(next, area);
      return next;
    });
  }, [area, persist]);

  const setField = useCallback(
    <K extends keyof NewShopItem>(k: K, v: NewShopItem[K]) => setDraft((d) => ({ ...d, [k]: v })),
    [],
  );

  const pickPantry = useCallback((x: PantryItem) => {
    setDraft((d) => ({ ...d, name: x.name, g: x.g, unit: x.unit, price: String(x.price) }));
  }, []);

  const hits = useMemo(() => {
    const q = trim(draft.name);
    if (q === '') return [];
    if (PANTRY.some((x) => x.name === q)) return [];
    return PANTRY.filter((x) => x.name.includes(q)).slice(0, MAX_HITS);
  }, [draft.name]);

  const addReady = trim(draft.name) !== '' && num(draft.qty) > 0;

  const saveAdd = useCallback(() => {
    if (!addReady) return;
    const row: ShopRow = {
      id: live ? `n-${Date.now()}` : nextId,
      g: draft.g,
      name: trim(draft.name),
      unit: draft.unit,
      qty: trim(draft.qty),
      price: trim(draft.price),
      done: false,
      actual: '',
    };
    setItems((list) => {
      const next = [...list, row];
      persist(next, area);
      return next;
    });
    setNextId((i) => i + 1);
    setAddOpen(false);
    setDraft(emptyItem(draft.g, draft.unit));
  }, [addReady, draft, nextId, live, persist, area]);

  /**
   * סגירת הרשימה · מעבירה אותה להיסטוריה ופותחת רשימה חדשה.
   *
   * ⚠ **קודם הלחיצה נבלעה** · בלי פריט מסומן הפונקציה יצאה מיד
   * ובלי אומר דבר, ותקלת שרת נבלעה ב-`catch` ריק. עכשיו שתי
   * הדרכים מחזירות הודעה, ושקד רואה למה כלום לא קרה.
   */
  const closeList = useCallback(() => {
    setCloseErr('');
    if (items.filter((x) => x.done).length === 0) {
      setCloseErr('צריך לסמן לפחות פריט אחד שנקנה לפני סגירת הרשימה');
      return;
    }
    if (live) {
      void adminCloseShop()
        .then(reload)
        .catch((e: unknown) => setCloseErr(closeFail(e)));
      return;
    }
    setOpened(new Date());
    setItems([]);
  }, [items, live, reload]);

  const doneCount = items.filter((x) => x.done).length;
  const groups = useMemo(
    () =>
      GROUPS.map((g) => {
        const list = items.filter((x) => x.g === g);
        return { name: g, count: `${list.filter((x) => x.done).length}/${list.length}`, items: list };
      }).filter((g) => g.items.length > 0),
    [items],
  );

  const title = `${AREA[area]?.n ?? area} · ${opened.getDate()} ${MONTHS[opened.getMonth()]} · ${pad2(opened.getHours())}:${pad2(opened.getMinutes())}`;

  return {
    area, setArea, items, groups, draft, hits, addOpen, addReady, title, doneCount,
    estSum: items.reduce((s, x) => s + lineSum(x), 0),
    actSum: items.reduce((s, x) => s + paid(x), 0),
    pct: items.length ? Math.round((doneCount / items.length) * 100) : 0,
    canClose: doneCount > 0,
    closeErr,
    lineTotal: num(draft.qty) * num(draft.price),
    toggle, drop, setField, pickPantry, saveAdd, closeList,
    openAdd: useCallback(() => setAddOpen(true), []),
    closeAdd: useCallback(() => setAddOpen(false), []),
  };
}

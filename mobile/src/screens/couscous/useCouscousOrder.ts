import { useCallback, useMemo, useState } from 'react';
import { COUSCOUS_MENU } from '../../data/couscous';
import type { OrderLine } from '../../order/types';

/** בחירת המנות · המסירה והתשלום יושבים ב-useFulfillment המשותף */
export function useCouscousOrder() {
  const [qty, setQty] = useState<number[]>(() => COUSCOUS_MENU.map(() => 0));

  /* עדכון כמות · תמיד מערך חדש, בלי לשנות את הקיים */
  const bump = useCallback((i: number, d: number) => {
    setQty((prev) => prev.map((v, k) => (k === i ? Math.max(0, v + d) : v)));
  }, []);

  const meals = qty.reduce((s, v, i) => s + (COUSCOUS_MENU[i].meal ? v : 0), 0);
  const total = qty.reduce((s, v, i) => s + v * COUSCOUS_MENU[i].price, 0);

  const lines: OrderLine[] = useMemo(
    () =>
      COUSCOUS_MENU.map((it, i) => ({ name: it.name, qty: qty[i], sum: qty[i] * it.price })).filter(
        (l) => l.qty > 0,
      ),
    [qty],
  );

  return { qty, bump, meals, total, lines };
}

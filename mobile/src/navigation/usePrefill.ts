import { useEffect } from 'react';
import { useNav } from './store';

/**
 * צריכת המטען של ״להזמין שוב״.
 *
 * המסך מקבל את פרטי ההזמנה הקודמת פעם אחת, מסמן את הפריטים,
 * והמטען מתאפס — כך שרענון או חזרה לא מסמנים שוב.
 */
export function usePrefill(
  category: string,
  apply: (details: Record<string, unknown>) => void,
): void {
  const { takePrefill } = useNav();
  useEffect(() => {
    const load = takePrefill();
    if (load && load.category === category) apply(load.details);
    /* פעם אחת בעלייה · המטען חד-פעמי ממילא */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** מערך כמויות מתוך פרטי הזמנה · הצורה של קוסקוס ומגשי פירות */
export function qtyFrom(details: Record<string, unknown>, len: number): number[] | null {
  const raw = details.qty;
  if (!Array.isArray(raw)) return null;
  return Array.from({ length: len }, (_, i) => {
    const v = Number(raw[i]);
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
}

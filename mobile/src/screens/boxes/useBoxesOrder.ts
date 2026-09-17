import { useCallback, useMemo, useState } from 'react';
import {
  BOXES,
  CHALLAH_ONE,
  CHALLAH_PAIR,
  SALAD_PER_KG,
  priceOfBox,
  type Box,
  type Section,
} from '../../data/boxes';
import type { OrderLine } from '../../order/types';

export type Picks = Record<string, any>;

/**
 * מארזים שלא מוצגים באתר · שקד ביקשה להוריד את מארז הפרימיום.
 * הנתונים נשארים ב-boxes.ts כדי שאפשר יהיה להחזיר אותו בשורה אחת.
 */
const HIDDEN = ['premium'];
const VISIBLE_BOXES: Box[] = BOXES.filter((b) => !HIDDEN.includes(b.key));

/** סכום הכמויות בסעיף מרובה־כמות (row / count) */
export const sumOf = (v: unknown): number =>
  v && typeof v === 'object' ? Object.values(v as Record<string, number>).reduce((s, n) => s + n, 0) : 0;

/** סעיף מוסתר שלא נפתח עדיין · לא נחשב לחובה */
const isDormant = (s: Section, picks: Picks) =>
  !!s.when && picks[s.when.id] !== s.when.is;

/** האם כל הבחירות בסעיף מלאות */
const sectionReady = (s: Section, picks: Picks): boolean => {
  if (isDormant(s, picks)) return true;
  if (['chips', 'grid', 'cards', 'pair', 'hidden'].includes(s.kind)) return !!picks[s.id!];
  if ((s.kind === 'count' || s.kind === 'row') && s.cap != null) return sumOf(picks[s.id!]) === s.cap;
  return true;
};

export function useBoxesOrder() {
  /* null = מסך רשימת המארזים · אחרת האינדקס של המארז שנפתח */
  const [current, setCurrent] = useState<number | null>(null);
  const [picks, setPicks] = useState<Picks>({});

  /* ⚠ האינדקס חייב להיות של הרשימה המוצגת · הסינון מזיז את המפתחות,
     ובלי זה ״טעם של שנה טובה״ היה פותח את המארז שהוסתר */
  const box: Box | null = current === null ? null : VISIBLE_BOXES[current];

  const openBox = useCallback((i: number) => {
    setCurrent(i);
    setPicks({});
  }, []);

  const backToList = useCallback(() => {
    setCurrent(null);
    setPicks({});
  }, []);

  /**
   * ⚠ ״להזמין שוב״ · פותח את אותו מארז עם אותן בחירות.
   * מארז שכבר לא קיים (או שהוסתר) פשוט לא נפתח, ואז המסך נשאר
   * ברשימה — עדיף מלפתוח מארז שגוי.
   */
  const loadDetails = useCallback((d: Record<string, unknown>) => {
    const i = VISIBLE_BOXES.findIndex((b) => b.key === d.key);
    if (i < 0) return;
    setCurrent(i);
    setPicks(d.picks && typeof d.picks === 'object' ? { ...(d.picks as Picks) } : {});
  }, []);

  /** בחירה יחידה · גריד, קלפים, זוג, מוסתר */
  const select = useCallback((id: string, value: string) => {
    setPicks((p) => ({ ...p, [id]: value }));
  }, []);

  const setText = useCallback((id: string, value: string) => {
    setPicks((p) => ({ ...p, [id]: value }));
  }, []);

  const setNumber = useCallback((id: string, value: number) => {
    setPicks((p) => ({ ...p, [id]: value }));
  }, []);

  /** כמות לפריט בתוך סעיף מרובה־כמות · 0 מוריד אותו מהבחירה */
  const setQty = useCallback((id: string, name: string, value: number) => {
    setPicks((p) => {
      const cur: Record<string, number> = { ...(p[id] || {}) };
      if (value <= 0) delete cur[name];
      else cur[name] = value;
      return { ...p, [id]: cur };
    });
  }, []);

  const total = box ? priceOfBox(box, picks) : 0;

  const ready = useMemo(() => {
    if (!box) return false;
    if (box.key === 'free') return total > 0;
    return box.sections.every((s) => sectionReady(s, picks));
  }, [box, picks, total]);

/**
 * ⚠ **נוסח הסיכום של ״קחו כמה שבא לכם״ · 17 בספטמבר 2026** ·
 * בקשות של שקד, מילה במילה:
 * · ״אם הזמנתי חלה מסוג שומשום הוא לא צריך לכתוב שומשום אלא חלה
 *   עם ציפוי שומשום, אם זו חלה ללא כלום אז פשוט לרשום חלה ללא
 *   ציפוי״.
 * · ״לגבי הסלטים לא לרשום מ״ל אלא לרשום 500 גרם״.
 *
 * ⚠ **המרה של אחד לאחד** · מיליליטר של סלט נחשב גרם. זו ההנחה
 * שמאחורי הבקשה, ואם היא שגויה זה המקום לתקן.
 */
const PLAIN_COAT = 'קלאסית';
const coatLine = (coat: string) =>
  coat === PLAIN_COAT ? 'חלה ללא ציפוי' : `חלה עם ציפוי ${coat}`;
const saladLine = (name: string, ml: number) => `${name} · ${ml} גרם`;

/**
   * שורות הסיכום · המארז ואחריו הבחירות שנעשו בו.
   *
   * ⚠ **״קחו כמה שבא לכם״ יוצא מהכלל · 16 בספטמבר 2026** · בקשה של
   * שקד: ״אם זה קחו כמה שבא לכם הוא לא צריך להיכנס בתוך סיכום
   * ההזמנה, אלא מה שהזמנו בתוך הקטגוריה הזו נכנס, לעומת שאר
   * הקטגוריות שזה מארזים מוכנים מראש״.
   *
   * ההיגיון: מארז מוכן מראש **הוא** הפריט, ולכן שמו הוא השורה.
   * ב״קחו כמה שבא לכם״ אין מארז — יש חלות וסלטים שנבחרו אחד אחד,
   * ולכן הם השורות. הסכום הכולל מוצג בשורת הסה״כ בכל מקרה.
   */
  const lines: OrderLine[] = useMemo(() => {
    if (!box) return [];

    /**
     * ⚠ **״קחו כמה שבא לכם״ · שורות עם מחיר** · בקשה של שקד:
     * ״הוא לא רושם את המחיר ליד הפריט שהוזמן״.
     *
     * ⚠ **החלות מתומחרות כזוגות** · 44 ש״ח לזוג ו-25 ליחידה, ולכן
     * אי אפשר לתמחר שורה בנפרד. הסכום הכולל מחולק בין השורות לפי
     * מספר היחידות, והשורה האחרונה בולעת את שארית העיגול — כך
     * שהשורות מסתכמות **בדיוק** בסה״כ.
     */
    if (box.key === 'free') {
      const coats = (picks.coats ?? {}) as Record<string, number>;
      const salads = (picks.salads ?? {}) as Record<string, number>;
      const units = Object.values(coats).reduce((n, v) => n + v, 0);
      const challah =
        Math.floor(units / 2) * CHALLAH_PAIR + (units % 2) * CHALLAH_ONE;

      const out: OrderLine[] = [];
      const chosen = Object.entries(coats).filter(([, n]) => n > 0);
      let spent = 0;
      chosen.forEach(([coat, n], i) => {
        const last = i === chosen.length - 1;
        const sum = last ? challah - spent : Math.round((challah * n) / units);
        spent += sum;
        out.push({ qty: n, name: coatLine(coat), sum });
      });

      Object.entries(salads)
        .filter(([, ml]) => ml > 0)
        .forEach(([name, ml]) =>
          out.push({
            qty: 1,
            name: saladLine(name, ml),
            sum: Math.round((ml * SALAD_PER_KG) / 1000),
          }),
        );
      return out;
    }

    const out: OrderLine[] = [{ qty: 1, name: box.name, sum: total }];
    box.sections.forEach((s) => {
      if (!s.id || isDormant(s, picks)) return;
      const v = picks[s.id];
      if (!v) return;
      if (typeof v === 'string') out.push({ qty: 1, name: `${s.label || s.id} · ${v}`, sum: 0 });
      else if (typeof v === 'number') out.push({ qty: v, name: s.label || s.id, sum: 0 });
      else {
        Object.entries(v as Record<string, number>).forEach(([k, n]) =>
          out.push({ qty: n, name: `${k}${s.unit ? ` ${s.unit}` : ''}`, sum: 0 }),
        );
      }
    });
    return out;
  }, [box, picks, total]);

  return {
    boxes: VISIBLE_BOXES,
    current, box, openBox, backToList, loadDetails,
    picks, select, setText, setNumber, setQty,
    total, ready, lines,
  };
}

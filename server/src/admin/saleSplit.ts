import { compareCost, type DishView } from './costsMath.ts';

/**
 * פילוח החודש לפי מנה · לדיאגרמות שבתחתית דף הבית הניהולי.
 *
 * ⚠ **בקשה של שקד · 19 בספטמבר 2026** · ״איפה שהדיאגרמת עוגה —
 * שיוצג שם פילוח רק של ההכנסות מהמכירות של הקוסקוס והשניצל בכל
 * החודש. ואיפה שהיה את הדיאגרמה השנייה העמודות — שיוצג שם פילוח
 * רק של ההוצאות מהמכירות של הקוסקוס והשניצל בכל החודש״.
 *
 * ובתשובה לשאלה איך לפלח: ״לפי מנה… אבל שהקוסקוס והשניצל יהיה
 * מופרד בכפתור שיחליף ביניהם, וכל פעם יציג הוצאות והכנסות של
 * קטגוריה אחרת״ — ולכן כאן מוחזרות **שתי** הקטגוריות, והמסך בוחר
 * איזו מהן לצייר.
 *
 * ⚠ **ההכנסה היא מחיר המנה כפול הכמות** · ולא `order.total`,
 * שכולל גם דמי משלוח ואינו מתפלג למנות.
 *
 * ⚠ **ההוצאה היא עלות הייצור** · טבלת ההוצאות מסווגת לפי סוג
 * ההוצאה (חומרי גלם, אריזות) ולא לפי מנה, ולכן אי אפשר לפלג
 * אותה. מה שכן ניתן לחשב הוא כמה עלה לייצר את מה שנמכר, לפי
 * עלויות הייצור שהיא מזינה במסך העלויות.
 *
 * ⚠ **מנה שלא נמכרה נשארת ברשימה עם 0** · הפילוח צריך להראות את
 * כל התפריט, לא רק את מה שנמכר.
 */
export type SplitRow = {
  id: string;
  name: string;
  sold: number;
  revenue: number;
  cost: number;
};

export type SplitCat = { id: string; n: string; hue: string; rows: SplitRow[] };

/** שתי הקטגוריות שהכפתור מחליף ביניהן · הגוונים הם של מסכי הניהול */
export const SPLIT_CATS: { id: string; n: string; hue: string }[] = [
  { id: 'cous', n: 'קוסקוס', hue: '#7B5CBC' },
  { id: 'schn', n: 'שישניצל', hue: '#416D9E' },
];

/** כמה יחידות נמכרו מכל מנה · מפתח המנה אל הכמות */
export type SoldMap = Record<string, number>;

export function splitByDish(dishes: DishView[], sold: SoldMap): SplitCat[] {
  return SPLIT_CATS.map((c) => ({
    id: c.id,
    n: c.n,
    hue: c.hue,
    rows: dishes
      .filter((d) => d.c === c.id)
      .map((d) => {
        const n = sold[d.id] ?? 0;
        return {
          id: d.id,
          name: d.name,
          sold: n,
          revenue: Math.round(d.price * n),
          cost: Math.round(compareCost(d, dishes) * n),
        };
      }),
  }));
}

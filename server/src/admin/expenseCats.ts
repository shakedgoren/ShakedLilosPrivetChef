import { EXPENSES } from '../../../mobile/src/data/adminMoney.ts';

/** שמות קטגוריות ההוצאה · מקור יחיד, מתוך מסך הכספים */
export const EXPENSE_CATS: string[] = EXPENSES.map((e) => e.k);

/** ברירת המחדל · כל מה שנקנה ואינו אריזה נחשב חומר גלם */
export const DEFAULT_EXPENSE_CAT = 'חומרי גלם';

/**
 * קבוצת המצרך בפנקס → קטגוריית הוצאה.
 *
 * ⚠ **לפי קבוצת הפריט ולא לפי סוג הרשימה** · שקד ביקשה שסגירת
 * רשימת קניות תרשום לקטגוריה הנכונה. סוגי הרשימות (קוסקוס,
 * שניצלים, מארזים, שף, טאבון, כללי) הם סוגי מכירה ולא סוגי
 * הוצאה — כולם קונים גם אוכל וגם אריזות. קבוצת המצרך עצמה
 * (״אריזות״ מול ״ירקות ופירות״, ״בשר עוף ודגים״, ״יבשים״,
 * ״חלב וגבינות״) היא ההבחנה האמיתית, ולכן סגירה אחת יכולה
 * לייצר שתי רשומות הוצאה בשתי קטגוריות.
 */
export const GROUP_TO_EXPENSE: Record<string, string> = {
  'אריזות': 'אריזות וכלים',
};

export function expenseCatOfGroup(group: string): string {
  return GROUP_TO_EXPENSE[group] ?? DEFAULT_EXPENSE_CAT;
}

export type PaidRow = { g: string; qty: string; price: string; actual: string; done: boolean };

/** כמה שולם על פריט אחד · הסכום בפועל גובר על כמות × מחיר */
export function paidOfRow(x: PaidRow): number {
  const actual = parseFloat(String(x.actual).replace(/[^\d.]/g, ''));
  if (Number.isFinite(actual) && String(x.actual).trim() !== '') return actual;
  const qty = parseFloat(String(x.qty).replace(/[^\d.]/g, '')) || 0;
  const price = parseFloat(String(x.price).replace(/[^\d.]/g, '')) || 0;
  return qty * price;
}

/** פיצול הקנייה לקטגוריות הוצאה · רק פריטים מסומנים, וסכום מעוגל */
export function splitByExpenseCat(items: PaidRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of items) {
    if (!x.done) continue;
    const cat = expenseCatOfGroup(x.g);
    out[cat] = (out[cat] ?? 0) + paidOfRow(x);
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k]);
  return out;
}

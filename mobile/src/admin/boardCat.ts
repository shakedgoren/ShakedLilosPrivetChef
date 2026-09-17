import { CATS as BOARD_CATS } from '../data/adminBoard';
import { CATS as DAY_CATS } from '../data/adminDays';
import { adminDishName } from './dishNames';

/**
 * הקטגוריה של לוח יום המכירה · לפי המכירה הקרובה.
 *
 * ⚠ **נבנה ב-17 בספטמבר 2026** · שקד דיווחה ש״אין התעדכנות האם
 * המכירה הקרובה מדובר על שלישי קוסקוס או שישי שניצל״. הסיבה: הלוח
 * השתמש ב-`CATS.cous` **מקובע**.
 *
 * ⚠ **בקנבס יש לוח לקוסקוס בלבד** · `data/adminBoard.ts` נוצר
 * אוטומטית מ-`AdminBoard.dc.html`, ושם מוגדרת רק קטגוריה אחת. לכן
 * לוח השניצל נבנה כאן מהמנות של יום המכירה (`data/adminDays.ts`),
 * שבו שתי הקטגוריות קיימות.
 */

/**
 * מחירי פריטי השניצל.
 * ⚠ **הועתקו מ-`data/adminMenu.ts`** · שם הם לפי שם מנה, וכאן לפי
 * מזהה, כי השמות בין שני הקבצים אינם זהים. אין להמציא כאן מחיר —
 * כל שינוי מחיר מגיע משקד ועובר קודם דרך התפריט.
 */
const SCHN_PRICE: Readonly<Record<string, number>> = {
  thin: 50,
  temp: 60,
  boxThin: 200,
  boxTemp: 250,
};

export type BoardItem = { id: string; t: string; sub: string; price: number; quota?: number };
export type BoardCategory = { name: string; hue: string; deep: string; items: BoardItem[] };

/** פיצול שם לשתי שורות הכותרת · ״מארז שניצל טמפורה״ → ״מארז״ + השאר */
function split(label: string): { t: string; sub: string } {
  const at = label.indexOf(' ');
  return at > 0 ? { t: label.slice(0, at), sub: label.slice(at + 1) } : { t: label, sub: '' };
}

export function boardCatOf(key: string): BoardCategory {
  const canvas = BOARD_CATS[key];
  if (canvas) return canvas as BoardCategory;

  const day = DAY_CATS[key as keyof typeof DAY_CATS];
  if (!day || day.dishes.length === 0) return BOARD_CATS.cous as BoardCategory;

  return {
    name: day.n,
    hue: day.hue,
    deep: day.deep,
    items: day.dishes.map((d) => ({
      id: d.id,
      ...split(adminDishName(d.n)),
      price: SCHN_PRICE[d.id] ?? 0,
      quota: d.q,
    })),
  };
}

/**
 * מוני ההכנה שבראש הלוח.
 *
 * ⚠ **לקוסקוס לפי מצרך ולא לפי מנה** · שקד הסבירה (15 בספטמבר
 * 2026) שהמונים אמורים לומר כמה **להכין מכל סוג**: כל מנה צריכה
 * קוסקוס, כל מנה מקבלת ירקות, וכן הלאה.
 *
 * ⚠ **לשאר הקטגוריות פריט-פריט** · אין להן חוק צבירה שנמסר, ומונה
 * שממציא קיבוץ גרוע ממונה פשוט.
 */
export type Prep = { id: string; name: string; of: readonly string[] };

const COUS_MEALS = ['veg', 'chick', 'mafr'] as const;
const COUS_PREP: Prep[] = [
  { id: 'cous', name: 'קוסקוס', of: COUS_MEALS },
  { id: 'veg', name: 'ירקות', of: [...COUS_MEALS, 'aVeg'] },
  { id: 'chick', name: 'עוף', of: ['chick', 'aChick'] },
  { id: 'mafr', name: 'מפרום', of: ['mafr', 'aMafr'] },
];

export function prepOf(key: string, items: BoardItem[]): Prep[] {
  if (key === 'cous') return COUS_PREP;
  return items.map((it) => ({
    id: it.id,
    name: `${it.t} ${it.sub}`.trim(),
    of: [it.id],
  }));
}

import { dateOpen, fruitDateOpen } from '../../../mobile/src/data/calendar.ts';

/**
 * האם מותר להזמין בתאריך הזה · **לקטגוריות שאינן יום מכירה.**
 *
 * ⚠ **הפער שזה סוגר · 26 בספטמבר 2026** · שקד: ״עבור כל השאר
 * באופן כללי פתוח, לא בשבת״. הכלל הזה **היה קיים רק באפליקציה**:
 * `fruitDateOpen` ו-`dateOpen` חוסמים את הלוח במסך, אבל השרת
 * קיבל כל תאריך שנשלח אליו.
 *
 * `resolveCustomerSaleDate` מחזיר כל מחרוזת שנראית כמו תאריך
 * (`if (isIsoDate(raw)) return raw`), ו-`evaluateCustomerSaleDay`
 * מחזיר `null` — כלומר מאשר — לכל קטגוריה שאינה קוסקוס או שניצל
 * כשאין שורת יום מכירה. התוצאה: אפשר היה לשלוח הזמנת מגש פירות
 * לשבת, או לתאריך שכבר עבר, וה-API היה מקבל אותה.
 *
 * ⚠ **כלל שקיים רק בלקוח אינו כלל** · כל מי שמדבר עם ה-API ישירות
 * עוקף אותו, וגם בילד ישן של האפליקציה עוקף אותו.
 *
 * ⚠ **אותם חוקים בדיוק, מאותו קובץ** · השרת מייבא את
 * `mobile/src/data/calendar` — בדיוק כמו ש-`quote.ts` כבר עושה.
 * כך אי אפשר שהמסך יראה יום פתוח והשרת יסרב, או להפך.
 *
 * ⚠ **קוסקוס ושניצל אינם כאן** · להם יש מנגנון משלהם
 * (`SALE_CATS` ו-`rec.open`), והוא כבר סוגר אותם כברירת מחדל.
 */

/** ⚠ הנוסחים כאן נכתבו על ידי Claude · שקד לא כתבה אותם */
export const DATE_RULE_MESSAGES = {
  past: 'התאריך הזה כבר עבר',
  saturday: 'שבת סגורה להזמנות',
  blocked: 'התאריך הזה סגור להזמנות',
} as const;

export type DateRuleError = { code: 'day_blocked'; message: string } | null;

/**
 * בודק תאריך מבוקש מול חוקי הלוח.
 * מחזיר `null` כשמותר.
 *
 * @param date  תאריך מבוקש · `YYYY-MM-DD`
 * @param category  `fruit` / `chef` / `box` · קוסקוס ושניצל לא עוברים כאן
 */
export function checkOrderDate(date: string, category: string): DateRuleError {
  const key = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;

  /**
   * ⚠ **מגשי פירות · שבת סגורה, וזהו** · הכלל שלהם פשוט יותר
   * מזה של השף. ראו `fruitDateOpen`.
   */
  if (category === 'fruit') {
    if (!fruitDateOpen(key)) {
      const past = key < todayIso();
      return {
        code: 'day_blocked',
        message: past ? DATE_RULE_MESSAGES.past : DATE_RULE_MESSAGES.saturday,
      };
    }
    return null;
  }

  /**
   * ⚠ **שף ומארזים · לפי `dateOpen`** · חוסם טווחי חג ותאריכים
   * שעברו. חלוקת היום (שישי ערב, שבת בוקר וצהריים) נשארת
   * ב-`dayPartOpen` שכבר נאכף ב-`quote.ts`.
   */
  if (!dateOpen(key)) {
    const past = key < todayIso();
    return {
      code: 'day_blocked',
      message: past ? DATE_RULE_MESSAGES.past : DATE_RULE_MESSAGES.blocked,
    };
  }
  return null;
}

/** היום, באותו פורמט של הלוח */
function todayIso(): string {
  const n = new Date();
  const p = (v: number) => String(v).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

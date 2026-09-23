import { PAYMENTS } from '../../../mobile/src/data/shared.ts';

/**
 * פיצול ההכנסה לפי אמצעי תשלום.
 *
 * ⚠ **בקשת שקד · 23 בספטמבר 2026** · ״בהכנסות חשוב שההכנסות
 * יישמרו גם עם סוג התשלום, לדוגמה במכירה של הקוסקוס נכנסו
 * 10,000 ש״ח — 2,500 בביט, 2,500 בפייבוקס ו-5,000 במזומן״.
 *
 * ⚠ **שום נתון חדש לא נשמר · זה חישוב** · כל הזמנה כבר נושאת
 * `pay` מרגע שהלקוחה בחרה אותו, והוא מאומת מול `PAYMENTS`
 * ב-`catalog/quote.ts`. הפיצול הוא סכימה של מה שכבר קיים, ולכן
 * הוא נכון גם רטרואקטיבית לכל ההזמנות שכבר במסד — בלי מיגרציה
 * ובלי הקלדה חוזרת.
 *
 * ⚠ **הסכום הוא `total` ולא `itemsTotal`** · שקד רואה את מה
 * שנכנס בפועל לכיס, כולל דמי משלוח.
 *
 * ⚠ **הזמנה בלי אמצעי תשלום נספרת ב׳לא צוין׳** · הצעות מחיר של
 * שף וטאבון נסגרות בשיחה, ו-`pay` נשאר ריק אצלן. להשמיט אותן
 * היה יוצר פער בין הסכום הכולל לסכום הפיצול.
 */

/** התווית של הזמנה שלא נשא אמצעי תשלום */
export const PAY_UNSET = 'לא צוין';

/** סדר התצוגה · כסדר הבחירה של הלקוחה, ו׳לא צוין׳ תמיד אחרון */
export const PAY_ORDER: string[] = [...PAYMENTS, PAY_UNSET];

export type PayShare = { pay: string; amount: number };

type OrderLike = { pay: string; total: number };

/**
 * מסכם את ההזמנות לפי אמצעי תשלום.
 *
 * מחזיר רק אמצעים שבהם באמת נכנס כסף, בסדר של `PAY_ORDER` —
 * כך שורה של מכירה אחת לא מציגה שלושה אפסים.
 */
export function payMix(orders: readonly OrderLike[]): PayShare[] {
  const sums = new Map<string, number>();
  for (const o of orders) {
    const key = o.pay?.trim() ? o.pay.trim() : PAY_UNSET;
    sums.set(key, (sums.get(key) ?? 0) + o.total);
  }

  const known = PAY_ORDER.filter((p) => sums.has(p)).map((pay) => ({ pay, amount: sums.get(pay) as number }));
  /* אמצעי שאינו ברשימה · לא אמור לקרות, אבל לא נבלע בשקט */
  const extra = [...sums.keys()]
    .filter((p) => !PAY_ORDER.includes(p))
    .sort()
    .map((pay) => ({ pay, amount: sums.get(pay) as number }));

  return [...known, ...extra];
}

/** סכום הפיצול · חייב להיות שווה לסכום ההכנסה */
export function payMixTotal(mix: readonly PayShare[]): number {
  return mix.reduce((t, s) => t + s.amount, 0);
}

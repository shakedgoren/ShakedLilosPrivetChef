import { z } from 'zod';
import { EXPENSE_METHODS } from '../../../mobile/src/data/adminMoney.ts';

/**
 * אמצעי התשלום של סגירת רשימת קניות.
 *
 * ⚠ **למה זה מודול נפרד ולא סכמה בתוך הנתיב** · כדי שאפשר יהיה
 * לבדוק אותו בלי להרכיב את אקספרס ובלי פריזמה · בדיוק מהסיבה
 * ש-`auth/loginBody.ts` נולד.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״ברשימות קנייה אין אופציה
 * לבחור שיטת תשלום״, ו״כמו במסך ההוצאות״. לכן זו אותה רשימה
 * (`EXPENSE_METHODS`) ולא רשימה חדשה: הוצאה שנולדה מקנייה והוצאה
 * שהוקלדה ביד חייבות להיות ניתנות להשוואה בדוח אחד.
 *
 * ⚠ **לא חובה** · ריק הוא ערך תקין, כמו בהוצאה ידנית. סגירה
 * שנשלחה בלי גוף בכלל נשארת חוקית — כך היא נשלחה עד היום.
 */
export const closeShopBody = z.object({
  method: z.enum(EXPENSE_METHODS).or(z.literal('')).default(''),
});

export function readCloseMethod(body: unknown): string {
  return closeShopBody.parse(body ?? {}).method;
}

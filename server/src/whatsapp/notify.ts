/**
 * שליחות מוצר · לא זורקות. הזמנה או קוד אימות לא נכשלים אם הספק
 * לא זמין.
 *
 * ⚠ **מה השתנה במעבר ל-Green API · 8 באוקטובר 2026** · הפונקציות
 * כאן שומרות בדיוק את אותה חתימה כלפי מי שקורא להן — `routes/orders`,
 * `routes/admin` ו-`routes/auth` לא השתנו כלל. מה שהשתנה הוא מה
 * שקורה בפנים: במקום לבחור **שם תבנית** ולשלוח פרמטרים לפי סדר,
 * מרכיבים כאן את **הטקסט המלא** מתוך `messages.ts`.
 */

import { sendText, type WhatsAppSendResult } from './client.ts';
import {
  confirmDeliveryText,
  confirmPickupText,
  deliveredText,
  otpText,
  readyPickupText,
} from './messages.ts';
import { confirmTemplateKind, statusTemplateKind, type OrderTemplateSlots, type UtilityKind } from './vars.ts';

export type OrderNotifyInput = OrderTemplateSlots & {
  phone: string;
  status: string;
};

export async function notifyOtp(phone: string, code: string): Promise<WhatsAppSendResult> {
  return sendText(phone, 'otp', otpText(code));
}

/** הנוסח לפי סוג ההודעה · כל אחד מהם ב-`messages.ts` */
function textFor(kind: UtilityKind, order: OrderTemplateSlots): string {
  switch (kind) {
    case 'confirmPickup':
      return confirmPickupText(order);
    case 'confirmDelivery':
      return confirmDeliveryText(order);
    case 'readyPickup':
      return readyPickupText(order);
    case 'delivered':
      return deliveredText(order);
  }
}

export async function notifyOrderConfirmed(order: OrderNotifyInput): Promise<WhatsAppSendResult> {
  const kind = confirmTemplateKind(order.ship);
  return sendText(order.phone, kind, textFor(kind, order));
}

export async function notifyOrderStatus(order: OrderNotifyInput): Promise<WhatsAppSendResult> {
  const kind = statusTemplateKind(order.status, order.ship);
  /* ⚠ לא כל שינוי סטטוס מזכה בהודעה · ראו `statusTemplateKind` */
  if (!kind) return { ok: false, skipped: 'no_text' };
  return sendText(order.phone, kind, textFor(kind, order));
}

/** הזמנות · לא מעכבות את התשובה ללקוחה */
export function notifyLater(task: Promise<unknown>): void {
  task.catch((err) => {
    console.error('whatsapp notify failed', err);
  });
}

/**
 * שליחות מוצר · לא זורקות. הזמנה/OTP לא נכשלים אם Meta לא זמין.
 */

import { env } from '../env.ts';
import { sendAuthOtp, sendUtility, type WhatsAppSendResult } from './client.ts';
import {
  confirmTemplateKind,
  orderUtilityBodyParams,
  statusTemplateKind,
  type OrderTemplateSlots,
  type UtilityKind,
} from './vars.ts';

export type OrderNotifyInput = OrderTemplateSlots & {
  phone: string;
  status: string;
};

export async function notifyOtp(phone: string, code: string): Promise<WhatsAppSendResult> {
  return sendAuthOtp(phone, code);
}

function templateName(kind: UtilityKind): string {
  const wa = env.whatsapp;
  switch (kind) {
    case 'confirmPickup':
      return wa.templateOrderConfirmedPickup;
    case 'confirmDelivery':
      return wa.templateOrderConfirmedDelivery;
    case 'readyPickup':
      return wa.templateOrderReadyPickup;
    case 'delivered':
      return wa.templateOrderDelivered;
  }
}

export async function notifyOrderConfirmed(order: OrderNotifyInput): Promise<WhatsAppSendResult> {
  const kind = confirmTemplateKind(order.ship);
  const name = templateName(kind);
  if (!name) return { ok: false, skipped: 'no_template' };
  return sendUtility(order.phone, name, orderUtilityBodyParams(order, kind));
}

export async function notifyOrderStatus(order: OrderNotifyInput): Promise<WhatsAppSendResult> {
  const kind = statusTemplateKind(order.status, order.ship);
  if (!kind) return { ok: false, skipped: 'no_template' };
  const name = templateName(kind);
  if (!name) return { ok: false, skipped: 'no_template' };
  return sendUtility(order.phone, name, orderUtilityBodyParams(order, kind));
}

/** הזמנות · לא מעכבות את התשובה ללקוחה */
export function notifyLater(task: Promise<unknown>): void {
  task.catch((err) => {
    console.error('whatsapp notify failed', err);
  });
}

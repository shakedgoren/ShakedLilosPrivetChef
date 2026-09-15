/**
 * שליחות מוצר · לא זורקות. הזמנה/OTP לא נכשלים אם Meta לא זמין.
 */

import { shipLabel } from '../catalog/quote.ts';
import { env } from '../env.ts';
import { sendAuthOtp, sendUtility, type WhatsAppSendResult } from './client.ts';

export type OrderNotifyInput = {
  id: string;
  phone: string;
  total: number;
  status: string;
  ship: string;
  time: string;
  city: string;
  address: string;
};

export function fulfillmentSummary(order: {
  ship: string;
  time: string;
  city: string;
  address: string;
}): string {
  const how = shipLabel(order.ship, order.address, order.city);
  const time = order.time.trim();
  return time ? `${how} · ${time}` : how;
}

export async function notifyOtp(phone: string, code: string): Promise<WhatsAppSendResult> {
  return sendAuthOtp(phone, code);
}

export async function notifyOrderConfirmed(order: OrderNotifyInput): Promise<WhatsAppSendResult> {
  const wa = env.whatsapp;
  return sendUtility(order.phone, wa.templateOrderConfirmed, [
    order.id,
    String(order.total),
    fulfillmentSummary(order),
  ]);
}

export async function notifyOrderStatus(order: OrderNotifyInput): Promise<WhatsAppSendResult> {
  const name = env.whatsapp.templateOrderStatus;
  if (!name) return { ok: false, skipped: 'no_template' };
  return sendUtility(order.phone, name, [order.id, order.status, fulfillmentSummary(order)]);
}

/** הזמנות · לא מעכבות את התשובה ללקוחה */
export function notifyLater(task: Promise<unknown>): void {
  task.catch((err) => {
    console.error('whatsapp notify failed', err);
  });
}

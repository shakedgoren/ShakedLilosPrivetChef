/**
 * לקוח Green API · שולח הודעות וואטסאפ כטקסט חופשי.
 *
 * ⚠ **החליף את WhatsApp Cloud API של Meta · 8 באוקטובר 2026** ·
 * בקשה של שקד. שני ההבדלים שמשנים את הקוד:
 *
 * · **אין תבניות ואין אישור מראש.** Meta דרשה תבנית מאושרת לכל
 *   הודעה יזומה, והנוסח חי אצלה. כאן שולחים טקסט, והנוסח עבר
 *   ל-`messages.ts` שבמאגר.
 * · **אין חלון 24 שעות.** אפשר לפנות ללקוחה מתי שצריך.
 *
 * ⚠ **המחיר של זה** · Green API מפעיל חשבון וואטסאפ **רגיל** שמחובר
 * בסריקת QR, ולא מספר Business API. כלומר ההודעות יוצאות מהמכשיר
 * של שקד, והאינסטנס חייב להישאר מחובר. אם הטלפון מתנתק — השליחה
 * נעצרת. זה מצב שצריך לנטר, לא להניח.
 *
 * ⚠ **כישלון יכול לחזור עם HTTP 200** · לפי התיעוד של Green API
 * ההודעה נכנסת לתור, והתשובה המיידית אינה הבטחה שהיא נשלחה. לכן
 * כאן תשובה נחשבת מוצלחת **רק אם היא מכילה `idMessage`**, וכישלון
 * אמיתי מתגלה בוובהוק `outgoingMessageStatus`.
 */

import { env } from '../env.ts';
import { isWhatsAppPhone, toGreenChatId } from './phone.ts';
import { noteWhatsAppFailure, noteWhatsAppSent } from './lastError.ts';

export type WhatsAppSendResult =
  | { ok: true; id: string; to: string }
  | { ok: false; skipped: 'disabled' | 'no_phone' | 'no_text' }
  | { ok: false; error: string; status?: number };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

let fetchImpl: FetchLike = (input, init) => fetch(input, init);

/** בדיקות · מחליף את fetch בלי לפנות ל-Green API */
export function setWhatsAppFetch(fn: FetchLike | null): void {
  fetchImpl = fn ?? ((input, init) => fetch(input, init));
}

export function isWhatsAppEnabled(): boolean {
  return env.whatsapp.enabled;
}

/**
 * ⚠ **הטוקן יושב בנתיב, לא בכותרת** · כך Green API בנוי. לכן
 * הכתובת הזו **לעולם לא נרשמת ליומן** — ראו `safeUrl`.
 */
function sendUrl(): string {
  const { apiUrl, idInstance, apiToken } = env.whatsapp;
  return `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`;
}

/** אותה כתובת בלי הטוקן · זו שמותר לרשום ביומן */
function safeUrl(): string {
  const { apiUrl, idInstance } = env.whatsapp;
  return `${apiUrl}/waInstance${idInstance}/sendMessage/***`;
}

/**
 * דילוג · נרשם ביומן ונספר, בדיוק כמו כישלון.
 *
 * ⚠ **למה דילוג הוא לא ״בסדר״** · הבדיקות יוצאות **לפני** הפנייה
 * לספק, ולכן בלי הרישום הזה הן לא כותבות דבר — לא ליומן ולא
 * למונה. מבחוץ זה נראה בדיוק כמו הצלחה שקטה, ועבור הלקוחה שמחכה
 * לקוד אין בין השניים שום הבדל.
 */
function skip(kind: string, reason: 'disabled' | 'no_phone' | 'no_text'): WhatsAppSendResult {
  console.warn('[וואטסאפ] דולג ·', kind, '·', reason);
  noteWhatsAppFailure(kind, `skipped:${reason}`);
  return { ok: false, skipped: reason };
}

/**
 * שליחת טקסט אחד.
 * @param kind  לאיזה סוג הודעה זה שייך · ליומן ולמעקב הכשלים בלבד
 */
export async function sendText(phone: string, kind: string, text: string): Promise<WhatsAppSendResult> {
  const wa = env.whatsapp;
  if (!wa.enabled) return skip(kind, 'disabled');
  if (!isWhatsAppPhone(phone)) return skip(kind, 'no_phone');
  if (!text.trim()) return skip(kind, 'no_text');

  const chatId = toGreenChatId(phone);

  let res: Response;
  try {
    res = await fetchImpl(sendUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chatId, message: text }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network_error';
    console.error('[וואטסאפ] בקשה נכשלה ·', safeUrl(), '·', message);
    noteWhatsAppFailure(kind, message);
    return { ok: false, error: message };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    /* ⚠ הגוף של Green API בשגיאה הוא טקסט חופשי · לא תמיד JSON */
    const message =
      (body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string'
        ? (body as { message: string }).message
        : '') || `http_${res.status}`;
    console.error('[וואטסאפ] שגיאה ·', res.status, '·', message);
    noteWhatsAppFailure(kind, message, res.status);
    return { ok: false, error: message, status: res.status };
  }

  const id =
    body && typeof body === 'object' ? String((body as { idMessage?: string }).idMessage ?? '') : '';

  /* ⚠ ראו ההערה למעלה · 200 בלי `idMessage` אינו הצלחה */
  if (!id) {
    console.error('[וואטסאפ] תשובה בלי idMessage ·', kind);
    noteWhatsAppFailure(kind, 'no_id_message', res.status);
    return { ok: false, error: 'no_id_message', status: res.status };
  }

  /**
   * ⚠ **לוג גם בהצלחה** · שקד בדקה פעם את יומן Render וכתבה ״אין
   * את השורה הזו שם״ — ובצדק: המסלול שתק גם בהצלחה וגם בדילוג.
   * יומן ריק לא הבדיל בין ״נשלח״ ל״דולג בשקט״.
   *
   * ⚠ **בלי הטקסט ובלי הטוקן** · רק סוג ההודעה, היעד והמזהה.
   */
  console.info('[וואטסאפ] נשלח ·', kind, '→', chatId, '·', id);
  noteWhatsAppSent();
  return { ok: true, id, to: chatId };
}

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
 *
 * ⚠ **שלוש השיטות חולקות את אותה צורה** · `sendMessage`,
 * `sendFileByUrl` ו-`sendLocation` נבדלות רק בשם בנתיב ובגוף.
 * (`sendFileByUpload` ו-`uploadFile` הן היחידות שיושבות על
 * `mediaUrl` ולא על `apiUrl` — אין בהן שימוש כאן.)
 */
type GreenMethod = 'sendMessage' | 'sendFileByUrl' | 'sendLocation';

function sendUrl(method: GreenMethod): string {
  const { apiUrl, idInstance, apiToken } = env.whatsapp;
  return `${apiUrl}/waInstance${idInstance}/${method}/${apiToken}`;
}

/** אותה כתובת בלי הטוקן · זו שמותר לרשום ביומן */
function safeUrl(method: GreenMethod): string {
  const { apiUrl, idInstance } = env.whatsapp;
  return `${apiUrl}/waInstance${idInstance}/${method}/***`;
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
 * הפנייה עצמה · זהה לשלוש השיטות.
 *
 * ⚠ **הופרדה ב-11 באוקטובר 2026** · עד אז כל הגוף הזה ישב בתוך
 * `sendText`. כשנוספו קובץ וסיכת מיקום, שכפול שלו היה אומר שלושה
 * עותקים של אותה בדיקת `idMessage`, אותו יומן ואותו מונה כשלים —
 * והם בדיוק מה שאסור שיתפצל.
 *
 * @param kind  לאיזה סוג הודעה זה שייך · ליומן ולמעקב הכשלים בלבד
 */
async function post(
  method: GreenMethod,
  kind: string,
  payload: Record<string, unknown>,
): Promise<WhatsAppSendResult> {
  const chatId = String(payload.chatId ?? '');

  let res: Response;
  try {
    res = await fetchImpl(sendUrl(method), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network_error';
    console.error('[וואטסאפ] בקשה נכשלה ·', safeUrl(method), '·', message);
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

/** שליחת טקסט אחד */
export async function sendText(phone: string, kind: string, text: string): Promise<WhatsAppSendResult> {
  if (!env.whatsapp.enabled) return skip(kind, 'disabled');
  if (!isWhatsAppPhone(phone)) return skip(kind, 'no_phone');
  if (!text.trim()) return skip(kind, 'no_text');
  return post('sendMessage', kind, { chatId: toGreenChatId(phone), message: text });
}

/**
 * שליחת קובץ לפי כתובת · **הקובץ חייב להיות נגיש בציבור**.
 *
 * ⚠ Green API הוא שמוריד אותו, לא אנחנו. כתובת מאחורי התחברות
 * או כתובת פנימית פשוט לא תימשך, והכישלון יגיע — אם בכלל —
 * דרך הוובהוק.
 *
 * ⚠ **`fileName` אינו קישוט** · הוא מה שקובע איך וואטסאפ מציג
 * את הקובץ, ולכן הוא חייב לשאת את הסיומת האמיתית.
 */
export async function sendFileByUrl(
  phone: string,
  kind: string,
  file: { urlFile: string; fileName: string; caption?: string },
): Promise<WhatsAppSendResult> {
  if (!env.whatsapp.enabled) return skip(kind, 'disabled');
  if (!isWhatsAppPhone(phone)) return skip(kind, 'no_phone');
  if (!file.urlFile.trim() || !file.fileName.trim()) return skip(kind, 'no_text');
  return post('sendFileByUrl', kind, {
    chatId: toGreenChatId(phone),
    urlFile: file.urlFile,
    fileName: file.fileName,
    caption: file.caption ?? '',
  });
}

/**
 * סיכת מיקום · ההודעה שנפתחת בלחיצה אל אפליקציית הניווט.
 *
 * ⚠ **קואורדינטות אמיתיות בלבד** · אין כאן גיאוקודינג, ושם
 * רחוב אינו מספיק. בלי `latitude`/`longitude` אין סיכה.
 */
export async function sendLocation(
  phone: string,
  kind: string,
  at: { nameLocation: string; address: string; latitude: number; longitude: number },
): Promise<WhatsAppSendResult> {
  if (!env.whatsapp.enabled) return skip(kind, 'disabled');
  if (!isWhatsAppPhone(phone)) return skip(kind, 'no_phone');
  if (!Number.isFinite(at.latitude) || !Number.isFinite(at.longitude)) {
    return skip(kind, 'no_text');
  }
  return post('sendLocation', kind, { chatId: toGreenChatId(phone), ...at });
}

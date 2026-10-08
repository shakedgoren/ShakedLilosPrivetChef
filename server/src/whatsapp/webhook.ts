/**
 * וובהוק נכנס מ-Green API.
 *
 * ⚠ **מה החליף את מה · 8 באוקטובר 2026** · אצל Meta היה אימות
 * `GET` עם `hub.mode` / `hub.verify_token` / `hub.challenge`. אצל
 * Green API אין טקס כזה: הוא פשוט שולח `POST`, ואם הוגדר
 * `webhookUrlToken` בהגדרות האינסטנס הוא מצרף אותו ככותרת
 * `Authorization: Bearer …`.
 *
 * ⚠⚠ **זה לא נוחות, זו הדרך היחידה לדעת שנכשלנו** · תשובת
 * ה-HTTP של Green API חוזרת 200 גם כשההודעה רק נכנסה לתור. אם
 * היא לא נשלחה בפועל — מספר שגוי, אין וואטסאפ לאותו מספר,
 * האינסטנס התנתק — זה מגיע **רק כאן**, כ-`outgoingMessageStatus`
 * עם `status: failed`. בלי הוובהוק הזה כישלון הוא שקט מוחלט.
 */

import { noteWhatsAppFailure } from './lastError.ts';

/** הסטטוסים ש-Green API מדווח על הודעה יוצאת */
export const FAILED_STATUSES = new Set(['failed', 'noAccount', 'notInGroup']);

export type WebhookAuth = { ok: true } | { ok: false; status: 401 | 404; error: string };

/**
 * האם הבקשה רשאית.
 * @param header  ערך הכותרת `Authorization` כפי שהגיע
 * @param expected  `GREENAPI_WEBHOOK_TOKEN` · ריק = הוובהוק כבוי
 */
export function authorizeWebhook(header: string, expected: string): WebhookAuth {
  if (!expected) return { ok: false, status: 404, error: 'whatsapp_webhook_disabled' };
  const given = header.trim().replace(/^Bearer\s+/i, '');
  /* ⚠ השוואה פשוטה · הטוקן אינו סוד קריפטוגרפי אלא מסנן רעש */
  if (given && given === expected) return { ok: true };
  return { ok: false, status: 401, error: 'whatsapp_webhook_unauthorized' };
}

export type StatusNote =
  | { kind: 'status'; id: string; status: string; failed: boolean }
  | { kind: 'other'; type: string };

/**
 * קורא גוף וובהוק ומחזיר מה שמעניין אותנו.
 * ⚠ **לא זורק על גוף לא מוכר** · Green API שולח סוגים רבים
 * (הודעות נכנסות, שינויי מצב האינסטנס). מה שלא מזוהה — מדווח
 * כ-`other` ונבלע.
 */
export function readWebhook(body: unknown): StatusNote {
  const b = (body ?? {}) as Record<string, unknown>;
  const type = typeof b.typeWebhook === 'string' ? b.typeWebhook : '';
  if (type !== 'outgoingMessageStatus') return { kind: 'other', type };
  const status = typeof b.status === 'string' ? b.status : '';
  const id = typeof b.idMessage === 'string' ? b.idMessage : '';
  return { kind: 'status', id, status, failed: FAILED_STATUSES.has(status) };
}

/** רושם כישלון שהתגלה דרך הוובהוק · מחזיר האם נרשם */
export function noteWebhook(note: StatusNote): boolean {
  if (note.kind !== 'status' || !note.failed) return false;
  noteWhatsAppFailure('outgoing', `${note.status}:${note.id || 'ללא מזהה'}`);
  console.error('[וואטסאפ] ההודעה נכשלה אצל הספק ·', note.status, '·', note.id || 'ללא מזהה');
  return true;
}

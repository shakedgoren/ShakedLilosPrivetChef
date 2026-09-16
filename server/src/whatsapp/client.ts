/**
 * לקוח WhatsApp Cloud API ישירות מול Meta (בלי BSP).
 * בלי TOKEN + PHONE_NUMBER_ID — לא שולחים, השרת ממשיך לרוץ.
 */

import { env } from '../env.ts';
import { authOtpPayload, utilityTemplatePayload, type TemplateMessagePayload } from './payloads.ts';
import { isWhatsAppPhone, toWhatsAppPhone } from './phone.ts';

export type WhatsAppSendResult =
  | { ok: true; id: string; to: string }
  | { ok: false; skipped: 'disabled' | 'no_phone' | 'no_template' }
  | { ok: false; error: string; status?: number };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

let fetchImpl: FetchLike = (input, init) => fetch(input, init);

/** בדיקות · מחליף את fetch בלי לגעת ב-Meta */
export function setWhatsAppFetch(fn: FetchLike | null): void {
  fetchImpl = fn ?? ((input, init) => fetch(input, init));
}

export function isWhatsAppEnabled(): boolean {
  return env.whatsapp.enabled;
}

function messagesUrl(): string {
  const { graphVersion, phoneNumberId } = env.whatsapp;
  return `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
}

async function postTemplate(payload: TemplateMessagePayload): Promise<WhatsAppSendResult> {
  const wa = env.whatsapp;
  if (!wa.enabled) return { ok: false, skipped: 'disabled' };

  let res: Response;
  try {
    res = await fetchImpl(messagesUrl(), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${wa.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network_error';
    console.error('whatsapp graph request failed', message);
    return { ok: false, error: message };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const errObj = body && typeof body === 'object' ? (body as { error?: { message?: string } }).error : null;
    const message = errObj?.message || `http_${res.status}`;
    console.error('whatsapp graph error', res.status, message);
    return { ok: false, error: message, status: res.status };
  }

  const id =
    body && typeof body === 'object'
      ? String(
          (body as { messages?: { id?: string }[] }).messages?.[0]?.id ??
            (body as { id?: string }).id ??
            '',
        )
      : '';
  return { ok: true, id, to: payload.to };
}

export async function sendTemplate(payload: TemplateMessagePayload): Promise<WhatsAppSendResult> {
  return postTemplate(payload);
}

export async function sendAuthOtp(phone: string, code: string): Promise<WhatsAppSendResult> {
  const wa = env.whatsapp;
  if (!wa.enabled) return { ok: false, skipped: 'disabled' };
  if (!isWhatsAppPhone(phone)) return { ok: false, skipped: 'no_phone' };
  return postTemplate(authOtpPayload(toWhatsAppPhone(phone), code, wa.templateOtp, wa.templateLang));
}

export async function sendUtility(
  phone: string,
  templateName: string,
  bodyParams: string[],
): Promise<WhatsAppSendResult> {
  const wa = env.whatsapp;
  if (!wa.enabled) return { ok: false, skipped: 'disabled' };
  if (!templateName) return { ok: false, skipped: 'no_template' };
  if (!isWhatsAppPhone(phone)) return { ok: false, skipped: 'no_phone' };
  return postTemplate(
    utilityTemplatePayload(toWhatsAppPhone(phone), templateName, wa.templateLang, bodyParams),
  );
}

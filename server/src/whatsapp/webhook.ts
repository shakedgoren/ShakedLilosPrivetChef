/**
 * אימות webhook של Meta · GET עם hub.mode / hub.verify_token / hub.challenge.
 * בדיקת חתימה על POST תתווסף בהמשך.
 */

export type WebhookQuery = Record<string, unknown>;

export function queryString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
}

export function verifyWebhookChallenge(
  query: WebhookQuery,
  expectedToken: string,
): { status: 200; body: string } | { status: 403 | 404; error: string } {
  if (!expectedToken) return { status: 404, error: 'whatsapp_webhook_disabled' };
  const mode = queryString(query['hub.mode']);
  const token = queryString(query['hub.verify_token']);
  const challenge = queryString(query['hub.challenge']);
  if (mode === 'subscribe' && token === expectedToken) {
    return { status: 200, body: challenge };
  }
  return { status: 403, error: 'whatsapp_webhook_forbidden' };
}

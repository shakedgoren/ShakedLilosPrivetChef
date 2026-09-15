/**
 * גופי בקשה ל-Meta Graph API `/{PHONE_NUMBER_ID}/messages`.
 * Authentication: copy-code — הקוד בפרמטר הגוף ובכפתור (sub_type url אחרי יצירת התבנית).
 * Utility: פרמטרים מספריים לפי סדר {{1}} {{2}} …
 */

export type TemplateTextParam = { type: 'text'; text: string };

export type TemplateComponent =
  | { type: 'body'; parameters: TemplateTextParam[] }
  | { type: 'button'; sub_type: 'url'; index: '0'; parameters: TemplateTextParam[] };

export type TemplateMessagePayload = {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components: TemplateComponent[];
  };
};

/** Meta דוחה ירידות שורה ורווחים מרובים בפרמטרי תבנית */
export function sanitizeTemplateParam(raw: string, max = 200): string {
  const t = raw.replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
  const cut = t.slice(0, max).trim();
  return cut || '—';
}

export function authOtpPayload(
  to: string,
  code: string,
  templateName: string,
  lang: string,
): TemplateMessagePayload {
  const text = sanitizeTemplateParam(code, 16);
  const param: TemplateTextParam = { type: 'text', text };
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        { type: 'body', parameters: [param] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [param] },
      ],
    },
  };
}

export function utilityTemplatePayload(
  to: string,
  templateName: string,
  lang: string,
  bodyParams: string[],
): TemplateMessagePayload {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        {
          type: 'body',
          parameters: bodyParams.map((p) => ({ type: 'text', text: sanitizeTemplateParam(p) })),
        },
      ],
    },
  };
}

/** ‎050-1234567 / +972… → ‎972501234567 · הפורמט ש-Graph API מצפה לו ב-`to` */

export function toWhatsAppPhone(raw: string): string {
  const digits = raw.trim().replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

export function isWhatsAppPhone(raw: string): boolean {
  const to = toWhatsAppPhone(raw);
  return to.length >= 11 && to.length <= 15;
}

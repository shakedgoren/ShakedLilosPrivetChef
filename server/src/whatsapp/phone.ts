/**
 * ‎050-1234567 / +972… → ‎972501234567
 *
 * ⚠ **הפורמט השתנה עם הספק · 8 באוקטובר 2026** · Meta ציפתה למספר
 * חשוף בשדה `to`. Green API מצפה ל-`chatId` בצורת `<מספר>@c.us`
 * (צ׳אט פרטי; קבוצה היא `@g.us`). המרת המספר עצמה לא השתנתה.
 */

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

/** ‎972501234567@c.us · מה ש-Green API מקבל ב-`chatId` */
export function toGreenChatId(raw: string): string {
  const digits = toWhatsAppPhone(raw);
  return digits ? `${digits}@c.us` : '';
}

/** מזהה ליומן · בלי הכתובת המלאה ובלי הקוד */
export function maskWho(raw: string): string {
  const v = raw.trim();
  const at = v.indexOf('@');
  if (at > 0) {
    const local = v.slice(0, at).replace(/[^\w.+-]/g, '');
    const domain = v.slice(at + 1).toLowerCase();
    return `${(local[0] ?? '*')}***@${domain}`;
  }
  const digits = v.replace(/\D/g, '');
  if (digits.length >= 4) return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
  return '***';
}

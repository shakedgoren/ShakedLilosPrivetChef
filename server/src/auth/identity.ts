/** נרמול טלפון ישראלי · 05X-XXXXXXX וגם +972 */
export function normalizePhone(raw: string): string {
  const t = raw.trim().replace(/[-\s]/g, '');
  if (t.startsWith('+972')) return '0' + t.slice(4);
  if (t.startsWith('972') && t.length >= 12) return '0' + t.slice(3);
  return t;
}

export function isEmail(raw: string): boolean {
  const v = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^[^\s@]+@localhost$/i.test(v);
}

export function isPhone(raw: string): boolean {
  return /^0(5\d|[2-4,8-9])\d{7}$/.test(normalizePhone(raw));
}

export type Who = { kind: 'email'; email: string } | { kind: 'phone'; phone: string };

export function parseWho(raw: string): Who | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.includes('@')) {
    if (!isEmail(v)) return null;
    return { kind: 'email', email: v.toLowerCase() };
  }
  if (!isPhone(v)) return null;
  return { kind: 'phone', phone: normalizePhone(v) };
}

export function publicUser(u: {
  id: string;
  role: string;
  email: string | null;
  phone: string | null;
  name: string;
  address: string;
  city: string;
}) {
  return {
    id: u.id,
    role: u.role,
    email: u.email,
    phone: u.phone,
    name: u.name,
    address: u.address,
    city: u.city,
  };
}

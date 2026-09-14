import { API_URL } from './config';
import { tokenStore } from './storage';
import { ApiError } from './types';

type Opts = {
  method?: string;
  body?: unknown;
  token?: string | null;
  auth?: boolean;
};

/**
 * תקרת זמן לבקשה.
 * ⚠ בלי זה `fetch` אל שרת שאינו מגיב **נתקע עד שמערכת ההפעלה
 * מוותרת** — נמדד בדפדפן: מעל 6 שניות בלי שגיאה ובלי תשובה.
 * בפועל זה מה שקרה כששקד ניסתה להתחבר וה-IP ב-`.env` היה ישן:
 * הכפתור נשאר תקוע ולא הופיעה שום הודעה. עכשיו הבקשה נכשלת
 * אחרי עשר שניות, והמסך מציג ״לא ניתן להתחבר כרגע״.
 */
const TIMEOUT_MS = 10000;

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  const token = opts.token === undefined ? (opts.auth === false ? null : await tokenStore.get()) : opts.token;
  if (token) headers.authorization = `Bearer ${token}`;

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: abort.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: { error?: string; message?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: 'bad_response' };
  }

  if (!res.ok) throw new ApiError(res.status, data.error ?? 'server_error', data.message);
  return data as T;
}

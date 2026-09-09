import { API_URL } from './config';
import { tokenStore } from './storage';
import { ApiError } from './types';

type Opts = {
  method?: string;
  body?: unknown;
  token?: string | null;
  auth?: boolean;
};

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  const token = opts.token === undefined ? (opts.auth === false ? null : await tokenStore.get()) : opts.token;
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

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

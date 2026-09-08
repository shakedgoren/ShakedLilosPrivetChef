const KEY = 'bite-and-tell.token';

const mem = new Map<string, string>();

const web = (): Storage | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
};

export const tokenStore = {
  async get(): Promise<string | null> {
    const w = web();
    if (w) return w.getItem(KEY);
    return mem.get(KEY) ?? null;
  },
  async set(token: string): Promise<void> {
    mem.set(KEY, token);
    web()?.setItem(KEY, token);
  },
  async clear(): Promise<void> {
    mem.delete(KEY);
    web()?.removeItem(KEY);
  },
};

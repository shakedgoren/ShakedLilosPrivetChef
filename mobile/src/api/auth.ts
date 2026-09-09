import { api } from './client';
import type { PublicUser, Session } from './types';

export const login = (who: string, password: string) =>
  api<Session>('/auth/login', { body: { who, password }, auth: false });

export const register = (who: string, password: string, name?: string) =>
  api<Session>('/auth/register', { body: { who, password, name }, auth: false });

export const forgotPassword = (who: string) =>
  api<{ ok: true }>('/auth/forgot-password', { body: { who }, auth: false });

export const googleSignIn = (idToken: string) =>
  api<Session>('/auth/google', { body: { idToken }, auth: false });

/** בלי SDK של גוגל · שולח טוקן ריק ומקבל 501 עד ש-GOOGLE_CLIENT_ID מוגדר בשרת */
export const googleStub = () => googleSignIn('');

export const me = (token?: string) => api<{ user: PublicUser }>('/auth/me', { token });

export const updateMe = (
  patch: Partial<Pick<PublicUser, 'name' | 'phone' | 'address' | 'city' | 'avatarUrl'>> & {
    email?: string | null;
    image?: string;
    imageBase64?: string;
  },
) => api<{ user: PublicUser }>('/users/me', { method: 'PATCH', body: patch });

export const uploadAvatar = (imageDataUrl: string) =>
  api<{ user: PublicUser }>('/users/me/photo', { body: { image: imageDataUrl } });

export const changePassword = (current: string, next: string) =>
  api<{ ok: true }>('/auth/change-password', { body: { current, next } });

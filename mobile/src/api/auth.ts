import { api } from './client';
import type { PublicUser, Session } from './types';

export const login = (who: string, password: string) =>
  api<Session>('/auth/login', { body: { who, password }, auth: false });

/**
 * ⚠ **המייל והמגדר נשלחים כאן · 19 בספטמבר 2026** · הם נשלחו עד
 * היום בקריאה שנייה ל-`updateMe` מיד אחרי ההרשמה, שנעטפה ב-`catch`
 * ריק — כלומר כשלון היה בלתי נראה, ושקד דיווחה שהם לא נשמרים.
 */
export const register = (
  who: string,
  password: string,
  name?: string,
  extra?: { email?: string | null; gender?: PublicUser['gender'] },
) => api<Session>('/auth/register', { body: { who, password, name, ...extra }, auth: false });

export const forgotPassword = (who: string) =>
  api<{ ok: true }>('/auth/forgot-password', { body: { who }, auth: false });

export const requestOtp = (who: string) =>
  api<{ ok: true; code?: string }>('/auth/otp/request', { body: { who }, auth: false });

/**
 * אימות טלפון **לפני** שיש חשבון · להרשמה.
 * ⚠ לא `otp/request` · הוא מחפש משתמש קיים, ובהרשמה עדיין אין כזה.
 */
export const registerPhone = (phone: string) =>
  api<{ ok: true; code?: string }>('/auth/register/phone', { body: { phone }, auth: false });

export const registerVerify = (phone: string, code: string) =>
  api<{ ok: true }>('/auth/register/verify', { body: { phone, code }, auth: false });

export const verifyOtp = (who: string, code: string) =>
  api<Session>('/auth/otp/verify', { body: { who, code }, auth: false });

export const googleSignIn = (idToken: string) =>
  api<Session>('/auth/google', { body: { idToken }, auth: false });

/** בלי SDK של גוגל · שולח טוקן ריק ומקבל 501 עד ש-GOOGLE_CLIENT_ID מוגדר בשרת */
export const googleStub = () => googleSignIn('');

export const me = (token?: string) => api<{ user: PublicUser }>('/auth/me', { token });

export const updateMe = (
  patch: Partial<Pick<PublicUser, 'name' | 'phone' | 'address' | 'city' | 'avatarUrl' | 'gender'>> & {
    email?: string | null;
    image?: string;
    imageBase64?: string;
  },
) => api<{ user: PublicUser }>('/users/me', { method: 'PATCH', body: patch });

export const uploadAvatar = (imageDataUrl: string) =>
  api<{ user: PublicUser }>('/users/me/photo', { body: { image: imageDataUrl } });

export const changePassword = (current: string, next: string) =>
  api<{ ok: true }>('/auth/change-password', { body: { current, next } });

import { api } from './client';
import type { PublicUser, Session } from './types';

export const login = (who: string, password: string) =>
  api<Session>('/auth/login', { body: { who, password }, auth: false });

export const register = (who: string, password: string, name?: string) =>
  api<Session>('/auth/register', { body: { who, password, name }, auth: false });

export const forgotPassword = (who: string) =>
  api<{ ok: true }>('/auth/forgot-password', { body: { who }, auth: false });

export const googleStub = () =>
  api<Session>('/auth/google', { body: { idToken: '' }, auth: false });

export const me = (token?: string) => api<{ user: PublicUser }>('/auth/me', { token });

export const updateMe = (patch: Partial<Pick<PublicUser, 'name' | 'phone' | 'address' | 'city'>>) =>
  api<{ user: PublicUser }>('/users/me', { method: 'PATCH', body: patch });

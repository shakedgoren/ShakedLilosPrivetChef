import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db.ts';
import { env } from '../env.ts';
import { unauthorized } from '../errors.ts';

export type GoogleProfile = {
  googleId: string;
  email: string | null;
  name: string;
  picture: string;
};

/** בדיקות בלבד · idToken בפורמט test:googleId:email:name */
export function parseTestGoogleToken(idToken: string): GoogleProfile | null {
  if (env.node === 'production') return null;
  if (!idToken.startsWith('test:')) return null;
  const parts = idToken.split(':');
  const googleId = parts[1]?.trim() ?? '';
  const email = parts[2]?.trim() ?? '';
  const name = parts.slice(3).join(':').trim();
  if (!googleId) return null;
  return {
    googleId,
    email: email || null,
    name: name || '',
    picture: '',
  };
}

export async function verifyGoogleIdToken(idToken: string, audiences: string[]): Promise<GoogleProfile> {
  const fake = parseTestGoogleToken(idToken);
  if (fake) return fake;

  const client = new OAuth2Client();
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    payload = ticket.getPayload();
  } catch {
    throw unauthorized('invalid_google_token', 'התחברות עם גוגל נכשלה');
  }
  if (!payload?.sub) throw unauthorized('invalid_google_token', 'התחברות עם גוגל נכשלה');
  if (payload.email && payload.email_verified === false) {
    throw unauthorized('invalid_google_token', 'התחברות עם גוגל נכשלה');
  }
  return {
    googleId: payload.sub,
    email: payload.email ? payload.email.toLowerCase() : null,
    name: (payload.name ?? '').trim(),
    picture: payload.picture ?? '',
  };
}

export async function upsertGoogleUser(profile: GoogleProfile) {
  const existing = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (existing) {
    const data: { name?: string; avatarUrl?: string; email?: string | null } = {};
    if (!existing.name && profile.name) data.name = profile.name;
    if (!existing.avatarUrl && profile.picture) data.avatarUrl = profile.picture;
    if (!existing.email && profile.email) data.email = profile.email;
    if (Object.keys(data).length) {
      return prisma.user.update({ where: { id: existing.id }, data });
    }
    return existing;
  }

  if (profile.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.googleId,
          name: byEmail.name || profile.name,
          avatarUrl: byEmail.avatarUrl || profile.picture,
        },
      });
    }
  }

  return prisma.user.create({
    data: {
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      role: 'customer',
    },
  });
}

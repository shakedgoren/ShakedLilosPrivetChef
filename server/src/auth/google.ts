import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db.ts';
import { env } from '../env.ts';
import { unauthorized } from '../errors.ts';
import { decideGoogleAccount, type GoogleAccount, type GoogleDecision } from './googleAccount.ts';

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

function asAccount(user: {
  id: string;
  googleId: string | null;
  email: string | null;
  name: string;
  avatarUrl: string;
  phone: string | null;
}): GoogleAccount {
  return {
    id: user.id,
    googleId: user.googleId,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
  };
}

/**
 * חיפוש בלי יצירה.
 * ⚠ אימייל מגוגל כבר באותיות קטנות · החיפוש אדיש לאותיות
 * כדי שחשבון שנשמר עם אות גדולה עדיין ייקשר ולא ישוכפל.
 */
export async function matchGoogleAccount(profile: GoogleProfile): Promise<{
  byGoogleId: GoogleAccount | null;
  byEmail: GoogleAccount | null;
  decision: GoogleDecision;
}> {
  const byGoogleIdRow = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  const byEmailRow = profile.email
    ? await prisma.user.findFirst({
        where: { email: { equals: profile.email, mode: 'insensitive' } },
      })
    : null;
  const byGoogleId = byGoogleIdRow ? asAccount(byGoogleIdRow) : null;
  const byEmail = byEmailRow ? asAccount(byEmailRow) : null;
  return { byGoogleId, byEmail, decision: decideGoogleAccount(profile, byGoogleId, byEmail) };
}

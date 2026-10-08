import type { GoogleProfile } from './google.ts';

/**
 * מה עושים עם חשבון גוגל · בלי מסד.
 *
 * ⚠ **חשבון חדש אינו נוצר כאן** · שקד ביקשה: מי שאין לו חשבון
 * עובר להרשמה, מאמת טלפון, ורק אז נוצרת רשומה. ההחלטה הזו
 * מחזירה `signup` בלי מזהה משתמש.
 *
 * כלל הקישור · בטוח בכוונה:
 * · מזהה גוגל שכבר שמור → נכנסים לאותו חשבון.
 * · אין מזהה גוגל, אבל האימייל שגוגל אימתה תואם חשבון קיים
 *   (גם אם נרשם בטלפון וסיסמה) ואין עליו גוגל אחר → קושרים
 *   ונכנסים. לא נפתח חשבון שני.
 * · האימייל כבר קשור לגוגל אחר → לא קושרים ולא משכפלים.
 *   אימייל מאומת אינו רשות להיכנס לחשבון של מישהו אחר.
 */

export type GoogleAccount = {
  id: string;
  googleId: string | null;
  email: string | null;
  name: string;
  avatarUrl: string;
  phone: string | null;
};

export type GooglePatch = {
  googleId?: string;
  name?: string;
  avatarUrl?: string;
  email?: string | null;
  phone?: string;
};

export type GoogleDecision =
  | { kind: 'login'; userId: string; patch: GooglePatch }
  | { kind: 'signup' }
  | { kind: 'conflict' };

function fillEmpty(user: GoogleAccount, profile: GoogleProfile, patch: GooglePatch): GooglePatch {
  if (!user.name && profile.name) patch.name = profile.name;
  if (!user.avatarUrl && profile.picture) patch.avatarUrl = profile.picture;
  return patch;
}

export function decideGoogleAccount(
  profile: GoogleProfile,
  byGoogleId: GoogleAccount | null,
  byEmail: GoogleAccount | null,
): GoogleDecision {
  if (byGoogleId) {
    const patch: GooglePatch = {};
    fillEmpty(byGoogleId, profile, patch);
    const emailFree = !profile.email || !byEmail || byEmail.id === byGoogleId.id;
    if (!byGoogleId.email && profile.email && emailFree) patch.email = profile.email;
    return { kind: 'login', userId: byGoogleId.id, patch };
  }

  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== profile.googleId) return { kind: 'conflict' };
    const patch: GooglePatch = {};
    if (byEmail.googleId !== profile.googleId) patch.googleId = profile.googleId;
    fillEmpty(byEmail, profile, patch);
    return { kind: 'login', userId: byEmail.id, patch };
  }

  return { kind: 'signup' };
}

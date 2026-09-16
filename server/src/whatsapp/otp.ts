import { randomBytes, randomInt } from 'node:crypto';
import { prisma } from '../db.ts';
import { notifyOtp } from './notify.ts';
import { RESET_TTL_MINUTES } from '../mail/resetEmail.ts';

export const OTP_TTL_MS = 10 * 60 * 1000;
/**
 * ⚠ **מקור אמת אחד לתוקף האיפוס** · היה כאן קבוע נפרד של שעה,
 * בזמן שהמייל הבטיח ללקוחה עשר דקות. שקד קבעה עשר, והנוסח במייל
 * והתוקף במסד חייבים לבוא מאותו מספר.
 */
export const RESET_TTL_MS = RESET_TTL_MINUTES * 60 * 1000;

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function issuePasswordReset(opts: {
  userId: string;
  phone: string | null;
}): Promise<{ token: string; expiresAt: Date; via: 'otp' | 'token' }> {
  await prisma.passwordReset.updateMany({
    where: { userId: opts.userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const useOtp = Boolean(opts.phone?.trim());
  const token = useOtp ? generateOtp() : randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + (useOtp ? OTP_TTL_MS : RESET_TTL_MS));
  await prisma.passwordReset.create({
    data: { userId: opts.userId, token, expiresAt },
  });

  if (useOtp && opts.phone) {
    try {
      await notifyOtp(opts.phone, token);
    } catch (err) {
      console.error('whatsapp otp failed', err);
    }
  }

  return { token, expiresAt, via: useOtp ? 'otp' : 'token' };
}

export async function consumeOtp(userId: string, code: string) {
  const token = code.trim();
  if (!token) return null;
  const row = await prisma.passwordReset.findFirst({
    where: { userId, token },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  await prisma.passwordReset.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return row;
}

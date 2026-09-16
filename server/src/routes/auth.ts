import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { env } from '../env.ts';
import { badRequest, unauthorized } from '../errors.ts';
import { parseWho, publicUser } from '../auth/identity.ts';
import { signToken } from '../auth/jwt.ts';
import { requireAuth } from '../auth/middleware.ts';
import { hashPassword, verifyPassword } from '../auth/passwords.ts';
import { upsertGoogleUser, verifyGoogleIdToken } from '../auth/google.ts';
import { buildResetEmail, RESET_TTL_HOURS } from '../mail/resetEmail.ts';
import { sendMail } from '../mail/mailer.ts';
import { consumeOtp, generateOtp, issuePasswordReset, OTP_TTL_MS } from '../whatsapp/otp.ts';
import { notifyOtp } from '../whatsapp/notify.ts';

export const authRouter = Router();

const whoBody = z.object({
  who: z.string().min(3),
  password: z.string().min(6),
  name: z.string().optional(),
});

const sessionOf = (user: { id: string; role: string }) => ({
  token: signToken({ sub: user.id, role: user.role }),
  user: publicUser(user as Parameters<typeof publicUser>[0]),
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = whoBody.parse(req.body);
    const who = parseWho(body.who);
    if (!who) throw badRequest('invalid_who');

    const existing =
      who.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: who.email } })
        : await prisma.user.findUnique({ where: { phone: who.phone } });
    if (existing) throw badRequest(who.kind === 'email' ? 'email_taken' : 'phone_taken');

    const user = await prisma.user.create({
      data: {
        email: who.kind === 'email' ? who.email : null,
        phone: who.kind === 'phone' ? who.phone : null,
        passwordHash: await hashPassword(body.password),
        name: body.name?.trim() ?? '',
        role: 'customer',
      },
    });
    res.status(201).json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = whoBody.pick({ who: true, password: true }).parse(req.body);
    const who = parseWho(body.who);
    if (!who) throw unauthorized('invalid_credentials');

    const user =
      who.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: who.email } })
        : await prisma.user.findUnique({ where: { phone: who.phone } });
    if (!user?.passwordHash) throw unauthorized('invalid_credentials');
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw unauthorized('invalid_credentials');

    res.json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const body = z.object({ who: z.string().min(3) }).parse(req.body);
    const who = parseWho(body.who);
    const payload: { ok: true; resetToken?: string; expiresAt?: string; via?: 'otp' | 'token' } = { ok: true };

    if (who) {
      const user =
        who.kind === 'email'
          ? await prisma.user.findUnique({ where: { email: who.email } })
          : await prisma.user.findUnique({ where: { phone: who.phone } });
      if (user) {
        const token = randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000);
        await prisma.passwordReset.create({
          data: { userId: user.id, token, expiresAt },
        });

        /**
         * ⚠ **החלטה של שקד** (16 בספטמבר 2026) · הקישור נשלח למייל.
         * אם לחשבון אין כתובת מייל אין לאן לשלוח — התשובה ללקוחה
         * נשארת זהה, והשרת רושם זאת ביומן בלבד.
         */
        if (user.email) {
          const mail = buildResetEmail({ name: user.name, token, appUrl: env.appUrl });
          /* ⚠ לא `res` · זה שם התשובה של אקספרס, והצללה כאן מסוכנת */
          const sent = await sendMail({ to: user.email, ...mail });
          if (!sent.sent) console.warn(`[איפוס] המייל לא יצא · ${sent.reason}`);
        } else {
          console.warn(`[איפוס] למשתמש ${user.id} אין כתובת מייל · לא נשלח קישור`);
        }

        let via: 'otp' | 'token' = 'token';
        if (user.phone) {
          const otp = generateOtp();
          await prisma.passwordReset.create({
            data: { userId: user.id, token: otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
          });
          try {
            await notifyOtp(user.phone, otp);
          } catch (err) {
            console.error('whatsapp otp failed', err);
          }
          via = 'otp';
        }

        if (env.resetDebug) {
          payload.resetToken = token;
          payload.expiresAt = expiresAt.toISOString();
          payload.via = via;
        }
      }
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const body = z.object({ token: z.string().min(4), password: z.string().min(6) }).parse(req.body);
    const row = await prisma.passwordReset.findUnique({ where: { token: body.token } });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw badRequest('reset_invalid');
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: await hashPassword(body.password) },
      }),
      prisma.passwordReset.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * קוד חד-פעמי בוואטסאפ (תבנית Authentication).
 * תמיד `{ ok: true }` כדי לא לחשוף אם יש חשבון.
 * עם `RESET_DEBUG=1` מוחזר גם `code` כשיש טלפון בחשבון.
 */
authRouter.post('/otp/request', async (req, res, next) => {
  try {
    const body = z.object({ who: z.string().min(3) }).parse(req.body);
    const who = parseWho(body.who);
    const payload: { ok: true; code?: string; expiresAt?: string } = { ok: true };

    if (who) {
      const user =
        who.kind === 'email'
          ? await prisma.user.findUnique({ where: { email: who.email } })
          : await prisma.user.findUnique({ where: { phone: who.phone } });
      if (user?.phone) {
        const issued = await issuePasswordReset({ userId: user.id, phone: user.phone });
        if (env.resetDebug) {
          payload.code = issued.token;
          payload.expiresAt = issued.expiresAt.toISOString();
        }
      }
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/otp/verify', async (req, res, next) => {
  try {
    const body = z.object({ who: z.string().min(3), code: z.string().min(4).max(16) }).parse(req.body);
    const who = parseWho(body.who);
    if (!who) throw badRequest('otp_invalid', 'הקוד לא תקין או שפג תוקפו');

    const user =
      who.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: who.email } })
        : await prisma.user.findUnique({ where: { phone: who.phone } });
    if (!user) throw badRequest('otp_invalid', 'הקוד לא תקין או שפג תוקפו');

    const row = await consumeOtp(user.id, body.code);
    if (!row) throw badRequest('otp_invalid', 'הקוד לא תקין או שפג תוקפו');

    res.json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/google', async (req, res, next) => {
  try {
    const audiences = env.googleClientIds;
    if (!audiences.length) {
      res.status(501).json({ error: 'google_not_configured' });
      return;
    }
    const body = z.object({ idToken: z.string().min(1) }).safeParse(req.body);
    if (!body.success) throw badRequest('google_token_required', 'חסר idToken מגוגל');

    const profile = await verifyGoogleIdToken(body.data.idToken, audiences);
    const user = await upsertGoogleUser(profile);
    res.json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        current: z.string().min(1),
        next: z.string().min(8),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.passwordHash) throw unauthorized('invalid_credentials');
    const ok = await verifyPassword(body.current, user.passwordHash);
    if (!ok) throw unauthorized('invalid_credentials');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.next) },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

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
    const payload: { ok: true; resetToken?: string; expiresAt?: string } = { ok: true };

    if (who) {
      const user =
        who.kind === 'email'
          ? await prisma.user.findUnique({ where: { email: who.email } })
          : await prisma.user.findUnique({ where: { phone: who.phone } });
      if (user) {
        const token = randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordReset.create({
          data: { userId: user.id, token, expiresAt },
        });
        if (env.resetDebug) {
          payload.resetToken = token;
          payload.expiresAt = expiresAt.toISOString();
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
    const body = z.object({ token: z.string().min(8), password: z.string().min(6) }).parse(req.body);
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

authRouter.post('/google', async (_req, res) => {
  if (!env.googleClientId) {
    res.status(501).json({ error: 'google_not_configured' });
    return;
  }
  res.status(501).json({ error: 'google_not_configured' });
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

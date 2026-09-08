import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth } from '../auth/middleware.ts';
import { isEmail, isPhone, normalizePhone, publicUser } from '../auth/identity.ts';
import { badRequest } from '../errors.ts';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

usersRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().max(80).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().max(160).optional(),
        city: z.string().max(40).optional(),
        email: z.union([z.string().max(80), z.null()]).optional(),
      })
      .parse(req.body);

    const data: {
      name?: string;
      phone?: string | null;
      address?: string;
      city?: string;
      email?: string | null;
    } = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.address !== undefined) data.address = body.address.trim();
    /* העיר נשמרת כמו שהוקלדה · אזהרת המשלוח היא במסך, לא 400 */
    if (body.city !== undefined) data.city = body.city.trim();
    if (body.phone !== undefined) {
      const p = body.phone.trim();
      if (p && !isPhone(p)) throw badRequest('invalid_phone');
      const phone = p ? normalizePhone(p) : null;
      if (phone) {
        const taken = await prisma.user.findFirst({
          where: { phone, NOT: { id: req.user!.id } },
        });
        if (taken) throw badRequest('phone_taken');
      }
      data.phone = phone;
    }
    if (body.email !== undefined) {
      const raw = (body.email ?? '').trim();
      if (!raw) {
        data.email = null;
      } else {
        if (!isEmail(raw)) throw badRequest('invalid_who');
        const email = raw.toLowerCase();
        const taken = await prisma.user.findFirst({
          where: { email, NOT: { id: req.user!.id } },
        });
        if (taken) throw badRequest('email_taken');
        data.email = email;
      }
    }

    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

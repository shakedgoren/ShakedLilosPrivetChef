import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { CITIES } from '../../../mobile/src/data/shared.ts';
import { requireAuth } from '../auth/middleware.ts';
import { isPhone, normalizePhone, publicUser } from '../auth/identity.ts';
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
      })
      .parse(req.body);

    const data: { name?: string; phone?: string | null; address?: string; city?: string } = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.address !== undefined) data.address = body.address.trim();
    if (body.city !== undefined) {
      if (body.city && !(CITIES as readonly string[]).includes(body.city)) {
        throw badRequest('invalid_city');
      }
      data.city = body.city;
    }
    if (body.phone !== undefined) {
      const p = body.phone.trim();
      if (p && !isPhone(p)) throw badRequest('invalid_phone');
      data.phone = p ? normalizePhone(p) : null;
    }

    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

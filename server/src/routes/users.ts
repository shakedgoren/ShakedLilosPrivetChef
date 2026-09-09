import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth } from '../auth/middleware.ts';
import { isEmail, isPhone, normalizePhone, publicUser } from '../auth/identity.ts';
import { badRequest } from '../errors.ts';
import { parseImagePayload, saveAvatar } from '../uploads/avatar.ts';

export const usersRouter = Router();

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

function maybeMultipart(req: Request, res: Response, next: NextFunction) {
  const ct = String(req.headers['content-type'] ?? '');
  if (ct.includes('multipart/form-data')) {
    photoUpload.single('photo')(req, res, next);
    return;
  }
  next();
}

async function avatarFromRequest(req: Request, userId: string): Promise<string | undefined> {
  const file = req.file;
  if (file?.buffer?.length) {
    return saveAvatar(userId, file.buffer, file.mimetype);
  }
  const raw =
    (typeof req.body?.image === 'string' && req.body.image) ||
    (typeof req.body?.imageBase64 === 'string' && req.body.imageBase64) ||
    '';
  if (!raw) return undefined;
  const { buf, mime } = parseImagePayload(raw);
  return saveAvatar(userId, buf, mime);
}

usersRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

usersRouter.patch('/me', requireAuth, maybeMultipart, async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().max(80).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().max(160).optional(),
        city: z.string().max(40).optional(),
        email: z.union([z.string().max(80), z.null()]).optional(),
        image: z.string().optional(),
        imageBase64: z.string().optional(),
      })
      .parse(req.body ?? {});

    const data: {
      name?: string;
      phone?: string | null;
      address?: string;
      city?: string;
      email?: string | null;
      avatarUrl?: string;
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
    const avatarUrl = await avatarFromRequest(req, req.user!.id);
    if (avatarUrl) data.avatarUrl = avatarUrl;

    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/me/photo', requireAuth, maybeMultipart, async (req, res, next) => {
  try {
    const avatarUrl = await avatarFromRequest(req, req.user!.id);
    if (!avatarUrl) throw badRequest('invalid_image', 'חסרה תמונה');
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
    });
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

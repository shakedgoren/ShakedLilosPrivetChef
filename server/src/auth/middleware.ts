import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db.ts';
import { forbidden, unauthorized } from '../errors.ts';
import { readToken } from './jwt.ts';

export type AuthedUser = {
  id: string;
  role: string;
  email: string | null;
  phone: string | null;
  name: string;
  address: string;
  city: string;
  note: string;
  avatarUrl: string;
  createdAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

const toAuthed = (u: {
  id: string;
  role: string;
  email: string | null;
  phone: string | null;
  name: string;
  address: string;
  city: string;
  note: string;
  avatarUrl: string;
  createdAt: Date;
}): AuthedUser => ({
  id: u.id,
  role: u.role,
  email: u.email,
  phone: u.phone,
  name: u.name,
  address: u.address,
  city: u.city,
  note: u.note,
  avatarUrl: u.avatarUrl,
  createdAt: u.createdAt,
});

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header) return next();
  try {
    const payload = readToken(header);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user) req.user = toAuthed(user);
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const payload = readToken(req.header('authorization'));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw unauthorized();
    req.user = toAuthed(user);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin') return next(forbidden());
  next();
}

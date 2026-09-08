import jwt from 'jsonwebtoken';
import { env } from '../env.ts';
import { unauthorized } from '../errors.ts';

export type TokenPayload = {
  sub: string;
  role: string;
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: `${env.jwtExpiresHours}h`,
  });
}

export function readToken(header: string | undefined): TokenPayload {
  if (!header?.startsWith('Bearer ')) throw unauthorized();
  const token = header.slice(7).trim();
  if (!token) throw unauthorized();
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded !== 'object' || !decoded || typeof decoded.sub !== 'string') {
      throw unauthorized();
    }
    return { sub: decoded.sub, role: String(decoded.role ?? 'customer') };
  } catch {
    throw unauthorized();
  }
}

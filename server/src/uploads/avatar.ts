import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../env.ts';
import { badRequest } from '../errors.ts';

const MAX_BYTES = 2 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export function sniffImageMime(buf: Buffer, hinted?: string): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (hinted && MIME_EXT[hinted]) return hinted;
  return null;
}

export function parseImagePayload(raw: string): { buf: Buffer; mime: string } {
  const trimmed = raw.trim();
  const dataUrl = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (dataUrl) {
    const mime = dataUrl[1];
    const buf = Buffer.from(dataUrl[2].replace(/\s/g, ''), 'base64');
    return { buf, mime };
  }
  const buf = Buffer.from(trimmed, 'base64');
  const mime = sniffImageMime(buf) ?? 'image/jpeg';
  return { buf, mime };
}

export async function saveAvatar(userId: string, buf: Buffer, hintedMime?: string): Promise<string> {
  if (!buf.length) throw badRequest('invalid_image', 'חסרה תמונה');
  if (buf.length > MAX_BYTES) throw badRequest('image_too_large', 'התמונה גדולה מדי');
  const mime = sniffImageMime(buf, hintedMime);
  const ext = mime ? MIME_EXT[mime] : undefined;
  if (!ext) throw badRequest('invalid_image', 'סוג קובץ לא נתמך');

  const dir = join(env.uploadDir, 'avatars');
  await mkdir(dir, { recursive: true });
  const name = `${userId}${ext}`;
  await writeFile(join(dir, name), buf);
  return `/uploads/avatars/${name}`;
}

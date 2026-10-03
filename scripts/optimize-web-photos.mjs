/**
 * מייצר את תמונות הדפדפן · WebP בערך פי 2 מגודל התצוגה.
 *
 * רץ לפני `expo export --platform web`. המכשיר ממשיך לצרוך את
 * הקבצים ב-mobile/assets/photos כמו שהם.
 *
 *   sm · 320px  · רצועת הבית (אריח 116×140)
 *   md · 840px  · כרטיס הקטגוריה (258×407) ושאר התמונות במסך
 *   lg · 1280px · תצוגה מלאה אחרי לחיצה
 *
 * הלוגו והאייקונים של הקטגוריות קטנים יותר, לפי גודל התצוגה שלהם.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'mobile/package.json'));
const sharp = require('sharp');

const SRC = path.join(root, 'mobile/assets/photos');
const OUT = path.join(root, 'mobile/assets/photos-web');
const ICONS = path.join(root, 'mobile/assets');
const ICONS_OUT = path.join(root, 'mobile/assets/icons-web');
const FILES_TS = path.join(root, 'mobile/src/data/photoFiles.web.ts');

const TIERS = { sm: 320, md: 840, lg: 1280 };
const QUALITY = 80;

/** לוגו מוצג בעד 96px · 320px מכסה גם מסך צפוף */
const LOGO = new Set(['logo', 'logo-wide']);
const LOGO_EDGE = { sm: 256, md: 320, lg: 512 };

const CATEGORY_ICONS = ['Bowl.png', 'SchnitzelDish.png', 'Gift.png', 'FruitPlate.png', 'ChefHat.png'];

const natural = (a, b) =>
  a.replace(/\d+/g, (n) => n.padStart(6, '0')).localeCompare(b.replace(/\d+/g, (n) => n.padStart(6, '0')));

async function writeWebp(src, dest, edge) {
  const srcTime = fs.statSync(src).mtimeMs;
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= srcTime) return;
  await sharp(src)
    .rotate()
    .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4, alphaQuality: 90 })
    .toFile(dest);
}

const files = fs
  .readdirSync(SRC)
  .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
  .sort(natural);

if (files.length === 0) throw new Error('לא נמצאו תמונות ב-mobile/assets/photos');

for (const tier of Object.keys(TIERS)) fs.mkdirSync(path.join(OUT, tier), { recursive: true });
fs.mkdirSync(ICONS_OUT, { recursive: true });

let bytes = 0;
for (const file of files) {
  const name = path.basename(file, path.extname(file));
  const edges = LOGO.has(name) ? LOGO_EDGE : TIERS;
  for (const [tier, edge] of Object.entries(edges)) {
    const dest = path.join(OUT, tier, `${name}.webp`);
    await writeWebp(path.join(SRC, file), dest, edge);
    bytes += fs.statSync(dest).size;
  }
}

for (const file of CATEGORY_ICONS) {
  const dest = path.join(ICONS_OUT, file.replace(/\.png$/i, '.webp'));
  await writeWebp(path.join(ICONS, file), dest, 192);
  bytes += fs.statSync(dest).size;
}

const key = (f) => path.basename(f, path.extname(f));
const req = (tier, f) => `require('../../assets/photos-web/${tier}/${key(f)}.webp')`;
const block = (tier) => files.map((f) => `  '${key(f)}': ${req(tier, f)},`).join('\n');

const ts = `/**
 * תמונות הדפדפן · נוצר אוטומטית. אין לערוך ביד.
 * לעדכון: node scripts/optimize-web-photos.mjs
 */
import type { ImageSourcePropType } from 'react-native';

export const SM: Record<string, ImageSourcePropType> = {
${block('sm')}
};

export const MD: Record<string, ImageSourcePropType> = {
${block('md')}
};

export const LG: Record<string, ImageSourcePropType> = {
${block('lg')}
};
`;

if (!fs.existsSync(FILES_TS) || fs.readFileSync(FILES_TS, 'utf8') !== ts) fs.writeFileSync(FILES_TS, ts);
const mb = (bytes / 1024 / 1024).toFixed(1);
console.log(`WebP · ${files.length} תמונות × 3 + ${CATEGORY_ICONS.length} אייקונים · ${mb} MB`);

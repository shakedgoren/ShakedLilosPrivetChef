import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * בונה את מפת התמונות של האפליקציה.
 * ל-React Native דרוש require סטטי לכל קובץ, ולכן הקובץ נוצר ולא נכתב ביד.
 * לעדכון: bash scripts/sync-photos.sh && node scripts/emit-photos.mjs
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(root, 'mobile/assets/photos');
const OUT = path.join(root, 'mobile/src/data/photos.ts');

const files = fs.readdirSync(DIR).filter((f) => /\.(jpg|png)$/i.test(f)).sort();
if (files.length === 0) throw new Error('לא נמצאו תמונות · צריך להריץ קודם sync-photos.sh');

/** home-10 חייב לבוא אחרי home-9 · מיון טבעי ולא לקסיקוגרפי */
const natural = (a, b) =>
  a.replace(/\d+/g, (n) => n.padStart(6, '0')).localeCompare(b.replace(/\d+/g, (n) => n.padStart(6, '0')));

const key = (f) => path.basename(f, path.extname(f));
const lines = files.sort(natural).map((f) => `  '${key(f)}': require('../../assets/photos/${f}'),`);

/* קבוצות שמשמשות כקרוסלות · נבנות מהשמות עצמם ולא מוקלדות */
const group = (prefix) =>
  files.filter((f) => new RegExp(`^${prefix}-\\d+\\.`).test(f)).sort(natural).map(key);
const groups = { home: group('home'), chef: group('chef'), tabon: group('tabon'), parking: group('parking') };

/* גלריית המארזים · כל קובץ שמתחיל בקידומת של המארז, הראשי קודם.
   נבנה מהשמות ולא מוקלד, כדי שהעלאת תמונה חדשה תיכנס מעצמה. */
const BOX_PREFIX = {
  free: 'box-free',
  celebSalads: 'box-celebration-salads',
  celebMain: 'box-celebration-main',
  all: 'box-all',
  challah: 'box-challah',
  shana: 'box-shana',
};
const boxPhotos = Object.fromEntries(
  Object.entries(BOX_PREFIX).map(([k, prefix]) => {
    const exact = files.filter((f) => key(f) === prefix).map(key);
    const rest = files.filter((f) => key(f).startsWith(prefix + '-')).sort(natural).map(key);
    return [k, [...exact, ...rest]];
  }),
);
/* מארז פרימיום · arichat-shulhan הוא עריכת השולחן שצולמה למארז הזה */
if (files.some((f) => key(f) === 'arichat-shulhan')) {
  boxPhotos.premium = ['arichat-shulhan'];
}

const ts = `/**
 * מפת התמונות · נוצר אוטומטית מ-mobile/assets/photos.
 * לעדכון: bash scripts/sync-photos.sh && node scripts/emit-photos.mjs
 *
 * המקור: design/app/assets/originals/ · לא המוקטנות.
 */
import type { ImageSourcePropType } from 'react-native';

export type PhotoKey = ${files.map((f) => `'${key(f)}'`).join(' | ')};

export const PHOTOS: Record<PhotoKey, ImageSourcePropType> = {
${lines.join('\n')}
};

/** תמונה לפי שם · undefined כשאין קובץ כזה, כדי שהמסך יוכל ליפול למציין מקום */
export const photo = (name: string): ImageSourcePropType | undefined =>
  (PHOTOS as Record<string, ImageSourcePropType>)[name];

/* ── קרוסלות · נגזרות משמות הקבצים ── */
export const HOME_PHOTOS = ${JSON.stringify(groups.home)} as const;
export const CHEF_PHOTOS = ${JSON.stringify(groups.chef)} as const;
export const TABON_PHOTOS = ${JSON.stringify(groups.tabon)} as const;
export const PARKING_PHOTOS = ${JSON.stringify(groups.parking)} as const;

/**
 * גלריית כל מארז ספיישל · לפי מפתח המארז ב-boxes.ts.
 * שלוש תמונות מהשף עדיין חסרות · ראו MISSING_PHOTOS.
 */
export const BOX_PHOTOS: Record<string, string[]> = ${JSON.stringify(boxPhotos, null, 2)};

/** תמונות ששקד סימנה באדום · יגיעו בהמשך. המסך מציג מציין מקום. */
export const MISSING_PHOTOS = [
  'ממשותף לאישי',
  'שולחן קינוחים מעוצב',
  'חבילת שתייה ללא הגבלה',
] as const;

export const isMissingPhoto = (name: string) =>
  (MISSING_PHOTOS as readonly string[]).includes(name);

/** מנות הקוסקוס · לפי סדר COUSCOUS_MENU */
export const COUSCOUS_PHOTOS = [
  'dish-couscous-veg',
  'dish-couscous-chicken',
  'dish-couscous-mafroum',
  'dish-couscous-only-veg',
  'dish-couscous-only-chicken',
  'dish-couscous-only-mafroum',
] as const;

/** שישניצל · יחידה ואז מארז, לפי סדר SCHNITZEL_TYPES */
export const SCHNITZEL_UNIT_PHOTOS = ['dish-schnitzel-thin', 'dish-schnitzel-tampura'] as const;
export const SCHNITZEL_BOX_PHOTOS = ['schnitzel-thin-box', 'schnitzel-tampura-box'] as const;

/** מגשי פירות · לפי סדר FRUIT_TRAYS */
export const TRAY_PHOTOS = ['tray-meruba-large', 'tray-malben-large', 'tray-agol-xl', 'tray-boat'] as const;
`;

fs.writeFileSync(OUT, ts);
console.log('נכתב', path.relative(root, OUT), '·', files.length, 'תמונות');
console.log('מארזים:', Object.entries(boxPhotos).map(([k, v]) => k + '=' + v.length).join(' · '));
console.log('קרוסלות:', Object.entries(groups).map(([k, v]) => k + '=' + v.length).join(' · '));

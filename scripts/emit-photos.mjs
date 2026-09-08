import fs from 'fs';
import path from 'path';

/**
 * בונה את מפת התמונות של האפליקציה.
 * ל-React Native דרוש require סטטי לכל קובץ, ולכן הקובץ נוצר ולא נכתב ביד.
 * לעדכון: bash scripts/sync-photos.sh && node scripts/emit-photos.mjs
 */
const DIR = '/Users/shakedgoren/Downloads/files/mobile/assets/photos';
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/photos.ts';

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

const ts = `/**
 * מפת התמונות · נוצר אוטומטית מ-mobile/assets/photos.
 * לעדכון: bash scripts/sync-photos.sh && node scripts/emit-photos.mjs
 *
 * התמונות מגיעות מ-design/app/assets, בגודל שהמסך באמת צריך.
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
 * ⚠ ל-premium אין עדיין תמונה בתיקייה, ולכן הוא לא מופיע כאן
 * והמסך ייפול למציין מקום.
 */
export const BOX_PHOTOS: Record<string, string[]> = ${JSON.stringify(boxPhotos, null, 2)};
`;

fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', files.length, 'תמונות');
console.log('מארזים:', Object.entries(boxPhotos).map(([k,v])=>k+'='+v.length).join(' · '));
console.log('קרוסלות:', Object.entries(groups).map(([k, v]) => k + '=' + v.length).join(' · '));

/**
 * מפת התמונות · נוצר אוטומטית מ-mobile/assets/photos.
 * לעדכון: bash scripts/sync-photos.sh && node scripts/emit-photos.mjs
 *
 * הקבצים עצמם יושבים ב-photoFiles.ts (מכשיר) וב-photoFiles.web.ts
 * (דפדפן · WebP שמייצר scripts/optimize-web-photos.mjs).
 * המקור למכשיר: design/app/assets/originals/ · לא המוקטנות.
 */
import type { ImageSourcePropType } from 'react-native';
import { resolvePhoto, type PhotoTier } from './photoResolve';

export type { PhotoTier };
export type PhotoKey = 'arichat-shulhan' | 'box-all-2-cuscus' | 'box-all-5-chicken' | 'box-all-5-mafrum' | 'box-all-salads' | 'box-all' | 'box-celebration-main-2-cuscus' | 'box-celebration-main-5-chicken' | 'box-celebration-main-5-mafrum' | 'box-celebration-main' | 'box-celebration-salads' | 'box-challah-1' | 'box-challah-2' | 'box-challah-3' | 'box-challah-4' | 'box-challah' | 'box-free' | 'box-shana-1' | 'box-shana-2' | 'cat-boxes' | 'cat-chef' | 'cat-couscous' | 'cat-fruit' | 'cat-schnitzel' | 'chef-1' | 'chef-2' | 'chef-3' | 'chef-4' | 'chef-5' | 'chef-6' | 'chef-7' | 'chef-8' | 'chef-9' | 'chef-10' | 'chef-11' | 'chef-12' | 'chef-13' | 'chef-14' | 'dish-couscous-chicken' | 'dish-couscous-mafroum' | 'dish-couscous-only-chicken' | 'dish-couscous-only-mafroum' | 'dish-couscous-only-veg' | 'dish-couscous-veg' | 'dish-schnitzel-tampura' | 'dish-schnitzel-thin' | 'drink-no-limit' | 'hagasha-ishit' | 'home-1' | 'home-2' | 'home-3' | 'home-4' | 'home-5' | 'home-6' | 'home-7' | 'home-8' | 'home-9' | 'home-10' | 'kinuhim-table' | 'logo-wide' | 'logo' | 'parking-1' | 'parking-2' | 'parking-3' | 'parking-4' | 'schnitzel-tampura-box' | 'schnitzel-thin-box' | 'tabon-1' | 'tabon-2' | 'tabon-3' | 'tabon-4' | 'tabon-5' | 'tabon-6' | 'tabon-7' | 'tabon-8' | 'tabon-9' | 'tabon-10' | 'tabon-11' | 'tabon-12' | 'tray-agol-xl' | 'tray-boat' | 'tray-malben-large' | 'tray-meruba-large';

/**
 * תמונה לפי שם · undefined כשאין קובץ כזה, כדי שהמסך יוכל ליפול למציין מקום.
 * בדפדפן `tier` בוחר גודל (רצועה / כרטיס / מסך מלא). במכשיר מתעלמים ממנו.
 */
export const photo = (name: string, tier?: PhotoTier): ImageSourcePropType | undefined =>
  resolvePhoto(name, tier);

/* ── קרוסלות · נגזרות משמות הקבצים ── */
export const HOME_PHOTOS = ["home-1","home-2","home-3","home-4","home-5","home-6","home-7","home-8","home-9","home-10"] as const;
export const CHEF_PHOTOS = ["chef-1","chef-2","chef-3","chef-4","chef-5","chef-6","chef-7","chef-8","chef-9","chef-10","chef-11","chef-12","chef-13","chef-14"] as const;
export const TABON_PHOTOS = ["tabon-1","tabon-2","tabon-3","tabon-4","tabon-5","tabon-6","tabon-7","tabon-8","tabon-9","tabon-10","tabon-11","tabon-12"] as const;
export const PARKING_PHOTOS = ["parking-1","parking-2","parking-3","parking-4"] as const;

/** גלריית כל מארז ספיישל · לפי מפתח המארז ב-boxes.ts. */
export const BOX_PHOTOS: Record<string, string[]> = {
  "free": [
    "box-free"
  ],
  "celebSalads": [
    "box-celebration-salads"
  ],
  "celebMain": [
    "box-celebration-main",
    "box-celebration-main-2-cuscus",
    "box-celebration-main-5-chicken",
    "box-celebration-main-5-mafrum"
  ],
  "all": [
    "box-all",
    "box-all-2-cuscus",
    "box-all-5-chicken",
    "box-all-5-mafrum",
    "box-all-salads"
  ],
  "challah": [
    "box-challah",
    "box-challah-1",
    "box-challah-2",
    "box-challah-3",
    "box-challah-4"
  ],
  "shana": [
    "box-shana-1",
    "box-shana-2"
  ],
  "premium": [
    "arichat-shulhan"
  ]
};

/**
 * תמונות ששקד סימנה באדום · שלושתן הגיעו ב-14 בספטמבר
 * (hagasha-ishit, kinuhim-table, drink-no-limit) ומופו
 * ב-extraPhotos.ts. הרשימה נשארת ריקה לתמונה הבאה שתחסר.
 */
export const MISSING_PHOTOS: readonly string[] = [];

export const isMissingPhoto = (name: string) => MISSING_PHOTOS.includes(name);

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

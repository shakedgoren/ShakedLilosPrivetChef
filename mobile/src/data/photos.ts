/**
 * מפת התמונות · נוצר אוטומטית מ-mobile/assets/photos.
 * לעדכון: bash scripts/sync-photos.sh && node scripts/emit-photos.mjs
 *
 * המקור: design/app/assets/originals/ · לא המוקטנות.
 */
import type { ImageSourcePropType } from 'react-native';

export type PhotoKey = 'arichat-shulhan' | 'box-all-2-cuscus' | 'box-all-5-chicken' | 'box-all-5-mafrum' | 'box-all-salads' | 'box-all' | 'box-celebration-main-2-cuscus' | 'box-celebration-main-5-chicken' | 'box-celebration-main-5-mafrum' | 'box-celebration-main' | 'box-celebration-salads' | 'box-challah-1' | 'box-challah-2' | 'box-challah-3' | 'box-challah-4' | 'box-challah' | 'box-free' | 'box-shana-1' | 'box-shana-2' | 'cat-boxes' | 'cat-chef' | 'cat-couscous' | 'cat-fruit' | 'cat-schnitzel' | 'chef-1' | 'chef-2' | 'chef-3' | 'chef-4' | 'chef-5' | 'chef-6' | 'chef-7' | 'chef-8' | 'chef-9' | 'chef-10' | 'chef-11' | 'chef-12' | 'chef-13' | 'chef-14' | 'dish-couscous-chicken' | 'dish-couscous-mafroum' | 'dish-couscous-only-chicken' | 'dish-couscous-only-mafroum' | 'dish-couscous-only-veg' | 'dish-couscous-veg' | 'dish-schnitzel-tampura' | 'dish-schnitzel-thin' | 'home-1' | 'home-2' | 'home-3' | 'home-4' | 'home-5' | 'home-6' | 'home-7' | 'home-8' | 'home-9' | 'home-10' | 'logo-wide' | 'logo' | 'parking-1' | 'parking-2' | 'parking-3' | 'parking-4' | 'schnitzel-tampura-box' | 'schnitzel-thin-box' | 'tabon-1' | 'tabon-2' | 'tabon-3' | 'tabon-4' | 'tabon-5' | 'tabon-6' | 'tabon-7' | 'tabon-8' | 'tabon-9' | 'tabon-10' | 'tabon-11' | 'tabon-12' | 'tray-agol-xl' | 'tray-boat' | 'tray-malben-large' | 'tray-meruba-large';

export const PHOTOS: Record<PhotoKey, ImageSourcePropType> = {
  'arichat-shulhan': require('../../assets/photos/arichat-shulhan.jpg'),
  'box-all-2-cuscus': require('../../assets/photos/box-all-2-cuscus.jpg'),
  'box-all-5-chicken': require('../../assets/photos/box-all-5-chicken.jpg'),
  'box-all-5-mafrum': require('../../assets/photos/box-all-5-mafrum.jpg'),
  'box-all-salads': require('../../assets/photos/box-all-salads.jpg'),
  'box-all': require('../../assets/photos/box-all.jpg'),
  'box-celebration-main-2-cuscus': require('../../assets/photos/box-celebration-main-2-cuscus.jpg'),
  'box-celebration-main-5-chicken': require('../../assets/photos/box-celebration-main-5-chicken.jpg'),
  'box-celebration-main-5-mafrum': require('../../assets/photos/box-celebration-main-5-mafrum.jpg'),
  'box-celebration-main': require('../../assets/photos/box-celebration-main.jpg'),
  'box-celebration-salads': require('../../assets/photos/box-celebration-salads.jpg'),
  'box-challah-1': require('../../assets/photos/box-challah-1.jpg'),
  'box-challah-2': require('../../assets/photos/box-challah-2.jpg'),
  'box-challah-3': require('../../assets/photos/box-challah-3.jpg'),
  'box-challah-4': require('../../assets/photos/box-challah-4.jpg'),
  'box-challah': require('../../assets/photos/box-challah.jpg'),
  'box-free': require('../../assets/photos/box-free.jpg'),
  'box-shana-1': require('../../assets/photos/box-shana-1.jpg'),
  'box-shana-2': require('../../assets/photos/box-shana-2.jpg'),
  'cat-boxes': require('../../assets/photos/cat-boxes.jpg'),
  'cat-chef': require('../../assets/photos/cat-chef.jpg'),
  'cat-couscous': require('../../assets/photos/cat-couscous.jpg'),
  'cat-fruit': require('../../assets/photos/cat-fruit.jpg'),
  'cat-schnitzel': require('../../assets/photos/cat-schnitzel.jpg'),
  'chef-1': require('../../assets/photos/chef-1.jpg'),
  'chef-2': require('../../assets/photos/chef-2.jpg'),
  'chef-3': require('../../assets/photos/chef-3.jpg'),
  'chef-4': require('../../assets/photos/chef-4.jpg'),
  'chef-5': require('../../assets/photos/chef-5.jpg'),
  'chef-6': require('../../assets/photos/chef-6.jpg'),
  'chef-7': require('../../assets/photos/chef-7.jpg'),
  'chef-8': require('../../assets/photos/chef-8.jpg'),
  'chef-9': require('../../assets/photos/chef-9.jpg'),
  'chef-10': require('../../assets/photos/chef-10.jpg'),
  'chef-11': require('../../assets/photos/chef-11.jpg'),
  'chef-12': require('../../assets/photos/chef-12.jpg'),
  'chef-13': require('../../assets/photos/chef-13.jpg'),
  'chef-14': require('../../assets/photos/chef-14.jpg'),
  'dish-couscous-chicken': require('../../assets/photos/dish-couscous-chicken.jpg'),
  'dish-couscous-mafroum': require('../../assets/photos/dish-couscous-mafroum.jpg'),
  'dish-couscous-only-chicken': require('../../assets/photos/dish-couscous-only-chicken.jpg'),
  'dish-couscous-only-mafroum': require('../../assets/photos/dish-couscous-only-mafroum.jpg'),
  'dish-couscous-only-veg': require('../../assets/photos/dish-couscous-only-veg.jpg'),
  'dish-couscous-veg': require('../../assets/photos/dish-couscous-veg.jpg'),
  'dish-schnitzel-tampura': require('../../assets/photos/dish-schnitzel-tampura.jpg'),
  'dish-schnitzel-thin': require('../../assets/photos/dish-schnitzel-thin.jpg'),
  'home-1': require('../../assets/photos/home-1.jpg'),
  'home-2': require('../../assets/photos/home-2.jpg'),
  'home-3': require('../../assets/photos/home-3.jpg'),
  'home-4': require('../../assets/photos/home-4.jpg'),
  'home-5': require('../../assets/photos/home-5.jpg'),
  'home-6': require('../../assets/photos/home-6.jpg'),
  'home-7': require('../../assets/photos/home-7.jpg'),
  'home-8': require('../../assets/photos/home-8.jpg'),
  'home-9': require('../../assets/photos/home-9.jpg'),
  'home-10': require('../../assets/photos/home-10.jpg'),
  'logo-wide': require('../../assets/photos/logo-wide.jpg'),
  'logo': require('../../assets/photos/logo.png'),
  'parking-1': require('../../assets/photos/parking-1.jpg'),
  'parking-2': require('../../assets/photos/parking-2.jpg'),
  'parking-3': require('../../assets/photos/parking-3.jpg'),
  'parking-4': require('../../assets/photos/parking-4.jpg'),
  'schnitzel-tampura-box': require('../../assets/photos/schnitzel-tampura-box.jpg'),
  'schnitzel-thin-box': require('../../assets/photos/schnitzel-thin-box.jpg'),
  'tabon-1': require('../../assets/photos/tabon-1.jpg'),
  'tabon-2': require('../../assets/photos/tabon-2.jpg'),
  'tabon-3': require('../../assets/photos/tabon-3.jpg'),
  'tabon-4': require('../../assets/photos/tabon-4.jpg'),
  'tabon-5': require('../../assets/photos/tabon-5.jpg'),
  'tabon-6': require('../../assets/photos/tabon-6.jpg'),
  'tabon-7': require('../../assets/photos/tabon-7.jpg'),
  'tabon-8': require('../../assets/photos/tabon-8.jpg'),
  'tabon-9': require('../../assets/photos/tabon-9.jpg'),
  'tabon-10': require('../../assets/photos/tabon-10.jpg'),
  'tabon-11': require('../../assets/photos/tabon-11.jpg'),
  'tabon-12': require('../../assets/photos/tabon-12.jpg'),
  'tray-agol-xl': require('../../assets/photos/tray-agol-xl.jpg'),
  'tray-boat': require('../../assets/photos/tray-boat.jpg'),
  'tray-malben-large': require('../../assets/photos/tray-malben-large.jpg'),
  'tray-meruba-large': require('../../assets/photos/tray-meruba-large.jpg'),
};

/** תמונה לפי שם · undefined כשאין קובץ כזה, כדי שהמסך יוכל ליפול למציין מקום */
export const photo = (name: string): ImageSourcePropType | undefined =>
  (PHOTOS as Record<string, ImageSourcePropType>)[name];

/* ── קרוסלות · נגזרות משמות הקבצים ── */
export const HOME_PHOTOS = ["home-1","home-2","home-3","home-4","home-5","home-6","home-7","home-8","home-9","home-10"] as const;
export const CHEF_PHOTOS = ["chef-1","chef-2","chef-3","chef-4","chef-5","chef-6","chef-7","chef-8","chef-9","chef-10","chef-11","chef-12","chef-13","chef-14"] as const;
export const TABON_PHOTOS = ["tabon-1","tabon-2","tabon-3","tabon-4","tabon-5","tabon-6","tabon-7","tabon-8","tabon-9","tabon-10","tabon-11","tabon-12"] as const;
export const PARKING_PHOTOS = ["parking-1","parking-2","parking-3","parking-4"] as const;

/**
 * גלריית כל מארז ספיישל · לפי מפתח המארז ב-boxes.ts.
 * שלוש תמונות מהשף עדיין חסרות · ראו MISSING_PHOTOS.
 */
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

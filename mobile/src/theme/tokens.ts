/**
 * אסימוני העיצוב · הועתקו אחד לאחד מקנבס העיצוב (design/app).
 * כל ערך כאן מופיע גם שם — אין להמציא צבעים חדשים.
 */

export const brand = {
  /* הזהב של הלוגו · מהכהה לבהיר */
  goldDark: '#8A6A1F',
  gold: '#D4AF37',
  goldMid: '#C9A227',
  goldInk: '#A9812A',
  goldSoft: '#9C7F3F',
} as const;

export const surface = {
  ground: '#FCFBFB',
  ink: '#2A2430',
  inkSoft: '#4A4254',
  muted: '#7D7488',
  faint: '#8A8194',
  hairline: 'rgba(130,112,162,0.16)',
  glassEdge: 'rgba(255,255,255,0.75)',
} as const;

/** חמשת גווני הקטגוריות · rgb נשמר בנפרד כדי לגזור שקיפויות */
export const hues = {
  cous: { hue: '#7B5CBC', deep: '#43307A', rgb: '123,92,188' },
  schn: { hue: '#416D9E', deep: '#2B4A6E', rgb: '65,109,158' },
  box: { hue: '#437C59', deep: '#2C5A3E', rgb: '67,124,89' },
  fruit: { hue: '#B04A76', deep: '#7A2E4E', rgb: '176,74,118' },
  chef: { hue: '#A85A28', deep: '#7A3D18', rgb: '168,90,40' },
} as const;

export type CategoryKey = keyof typeof hues;

/** rgba מתוך שלישיית ה-rgb של גוון · a('123,92,188', 0.3) */
export const a = (rgb: string, alpha: number) => `rgba(${rgb},${alpha})`;

/** שלישיית rgb מתוך hex · '#43307A' → '67,48,122' */
export const hexRgb = (hex: string): string => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
};

/**
 * הגוון הכהה של הקטגוריה, כשלישיית rgb.
 * מציין המקום של התמונות בקנבס צובע את האייקון בגוון הכהה ואת
 * המסגרת המקווקוות בגוון הרגיל, ולכן צריך את שניהם.
 */
export const deepRgbOf = (rgb: string): string => {
  const match = Object.values(hues).find((h) => h.rgb === rgb);
  return match ? hexRgb(match.deep) : rgb;
};

export const type = {
  family: 'Assistant',
  display: 'Anton',
  /* הגדלים שנמדדו במסכים עצמם */
  mark: 36,
  markSub: 18,
  title: 30,
  subtitle: 17,
  body: 13.5,
  label: 12.5,
  tiny: 11,
} as const;

export const radius = { pill: 999, card: 26, tile: 18, field: 16 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 18, xl: 22, xxl: 30 } as const;

/** מסך הייחוס שכל המידות נמדדו עליו */
export const frame = { width: 390, height: 844 } as const;

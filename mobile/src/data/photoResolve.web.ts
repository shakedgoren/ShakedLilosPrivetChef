import type { ImageSourcePropType } from 'react-native';
import { LG, MD, SM } from './photoFiles.web';

/**
 * בדפדפן כל תמונה קיימת בשלושה גדלים של WebP, בערך פי 2 מגודל התצוגה:
 * · sm · רצועת הבית (~320px)
 * · md · כרטיסים ומנות (~840px בצלע הארוכה)
 * · lg · תצוגה מלאה בלחיצה (~1280px), נטען רק כשפותחים
 */
export type PhotoTier = 'sm' | 'md' | 'lg';

const BY_TIER = { sm: SM, md: MD, lg: LG } as const;

export function resolvePhoto(name: string, tier: PhotoTier = 'md'): ImageSourcePropType | undefined {
  return BY_TIER[tier][name] ?? MD[name];
}

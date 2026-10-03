import type { ImageSourcePropType } from 'react-native';
import { PHOTOS } from './photoFiles';

/**
 * גודל התמונה בדפדפן.
 * במכשיר אין רמות · תמיד הקובץ המקורי, כדי שלא ייפגע הבילד ל-iOS/Android.
 */
export type PhotoTier = 'sm' | 'md' | 'lg';

export function resolvePhoto(name: string, _tier?: PhotoTier): ImageSourcePropType | undefined {
  return PHOTOS[name];
}

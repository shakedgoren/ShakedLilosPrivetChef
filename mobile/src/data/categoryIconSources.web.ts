import type { ImageSourcePropType } from 'react-native';
import type { CategoryKey } from '../theme/tokens';

/**
 * אותם איורים, ב-~192px WebP · פי 3 בערך מ-56px שעל המסך.
 * נוצרים ב-scripts/optimize-web-photos.mjs
 */
export const CATEGORY_ICON_SOURCES: Record<CategoryKey, ImageSourcePropType> = {
  cous: require('../../assets/icons-web/Bowl.webp'),
  schn: require('../../assets/icons-web/SchnitzelDish.webp'),
  box: require('../../assets/icons-web/Gift.webp'),
  fruit: require('../../assets/icons-web/FruitPlate.webp'),
  chef: require('../../assets/icons-web/ChefHat.webp'),
};

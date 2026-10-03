import type { ImageSourcePropType } from 'react-native';
import type { CategoryKey } from '../theme/tokens';

/** האיורים התלת־ממדיים · במכשיר נשארים הקבצים ששקד אישרה */
export const CATEGORY_ICON_SOURCES: Record<CategoryKey, ImageSourcePropType> = {
  cous: require('../../assets/Bowl.png'),
  schn: require('../../assets/SchnitzelDish.png'),
  box: require('../../assets/Gift.png'),
  fruit: require('../../assets/FruitPlate.png'),
  chef: require('../../assets/ChefHat.png'),
};

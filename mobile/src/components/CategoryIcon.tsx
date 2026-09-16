import React from 'react';
import { Image } from 'react-native';
import type { CategoryKey } from '../theme/tokens';

/**
 * האייקון של כל קטגוריה · חמישה איורים תלת־ממדיים ששקד שלחה
 * (16 בספטמבר 2026) ל-`mobile/assets`, והם החליפו את חמש צורות
 * הקו שהיו כאן קודם.
 *
 * ⚠ **הצבע כבר לא נשלט מהקוד** · הצורות הקודמות היו `<svg>` ולכן
 * קיבלו `color` לפי הקטגוריה. איור מוכן מגיע עם הצבעים שלו, ולכן
 * ההבחנה בין קטגוריה פעילה לרדומה עברה ל-`dim` — שקיפות ולא גוון.
 *
 * ⚠ **הקבצים קוצצו והוקטנו** · שקד שלחה אותם ב-1254 פיקסלים
 * ובמשקל 6.2 מגה־בייט לחמישה, והם מוצגים כאן ב-30 פיקסלים.
 * השוליים השקופים נחתכו והצלע הארוכה הורדה ל-512, מה שהוריד את
 * המשקל ל-1.4 מגה־בייט. התמונה עצמה לא נגעה — רק המסגרת והגודל.
 */
const BY_KEY: Record<CategoryKey, number> = {
  cous: require('../../assets/Bowl.png'),
  schn: require('../../assets/SchnitzelDish.png'),
  box: require('../../assets/Gift.png'),
  fruit: require('../../assets/FruitPlate.png'),
  chef: require('../../assets/ChefHat.png'),
};

/**
 * הקטגוריה הרדומה · שקופה ולא אפורה, כדי שהאיור יישאר עצמו.
 * ⚠ **היה 0.55** · בצורות הקו העמעום היה חזק כי הן היו קו אחד בצבע
 * אחד. בתמונת הייחוס ששקד שלחה כל חמשת האיורים חיים באותה עוצמה,
 * ולכן כאן נשארה רק נגיעה של הבדל — 0.9, כמעט בלתי מורגש.
 */
const DIM = 0.9;

type Props = {
  categoryKey: CategoryKey;
  size?: number;
  /** קטגוריה שאינה הפעילה · מעומעמת */
  dim?: boolean;
};

export function CategoryIcon({ categoryKey, size = 27, dim = false }: Props) {
  return (
    <Image
      source={BY_KEY[categoryKey]}
      style={{ width: size, height: size, opacity: dim ? DIM : 1 }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

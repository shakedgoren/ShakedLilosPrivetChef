import React from 'react';
import { Bowl, BoxMeal, ChefHat, FruitPlate, SchnitzelDish } from '../icons';
import type { CategoryKey } from '../theme/tokens';

/**
 * האייקון של כל קטגוריה · חמש הצורות מגיעות מאותו <svg> בקנבס,
 * שם הן חמישה ענפי sc-if. המיפוי כאן הוא המקום היחיד שקושר
 * מפתח קטגוריה לצורה, כדי שכל מסך יקבל את אותה צורה בדיוק.
 */
const BY_KEY = {
  cous: Bowl,
  schn: SchnitzelDish,
  box: BoxMeal,
  fruit: FruitPlate,
  chef: ChefHat,
} as const;

type Props = { categoryKey: CategoryKey; size?: number; color: string; strokeWidth?: number };

export function CategoryIcon({ categoryKey, size = 27, color, strokeWidth = 1.7 }: Props) {
  const Glyph = BY_KEY[categoryKey];
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}

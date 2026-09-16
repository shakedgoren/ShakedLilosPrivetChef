import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NO_TOUCH } from '../../theme/pointerEvents';

/**
 * ערכת ״לבנדר״ · שפת הצבע של דף הניהול.
 *
 * ⚠ **היה כאן לילה כהה והוא ירד** · שקד בחרה (15 בספטמבר 2026)
 * את מבנה ״רצף״ בערכת ״לבנדר״ הבהירה, בהשראת ה-Soft 3D ששלחה.
 * הכרטיסים חולקים גרדיאנט אחד שיורד לאורך הדף — מלבן למעלה
 * ללבנדר רך למטה — וכך הם נקראים כגוף אחד.
 *
 * ⚠ **השם נשאר `NightSky`** · כדי לא לגעת בכל קובץ שמייבא אותו.
 * מה שהוא מצייר עכשיו אינו כוכבים אלא נקודות רכות בגוון ההדגשה.
 */

export const LAV = {
  /** רקע הדף · מתחת לכל הכרטיסים */
  page: '#F6F3FB',
  /** חמש מדרגות הגרדיאנט · לפי סדר הכרטיסים מלמעלה למטה */
  tints: ['#FFFFFF', '#F7F3FD', '#F1EBFB', '#EBE3F8', '#E5DBF5'],
  edge: 'rgba(142,111,208,0.16)',
  ink: '#3B2F58',
  dim: '#6E5E95',
  faint: '#9488B5',
  soft: '#54467A',
  accent: '#8E6FD0',
  /** גוון לכל מנה בטבעת · מהעז לרך */
  hues: ['#8E6FD0', '#A188DB', '#B49FE5', '#C3B2EC', '#D0C3F1', '#DCD2F5'],
  /** גווני הקטגוריות · סגול, תכלת, ירוק, אפרסק */
  cats: ['#8E6FD0', '#8FBFD8', '#9FC9AE', '#E8B48F'],
  good: '#7FC49B',
  chip: '#D9CDF5',
  chipInk: '#4A3A72',
  pill: 'rgba(142,111,208,0.12)',
  dot: '#C9B8F0',
} as const;

/**
 * ⚠ **הצל הרך · בשתי שכבות** · זו החתימה של ה-Soft 3D: אחת קרובה
 * וחדה שנותנת את המגע, ואחת רחוקה ומפוזרת שנותנת את המרחק.
 * שכבה אחת לבדה נראית שטוחה.
 */
export const SOFT_SHADOW =
  '0 2px 4px -2px rgba(90,80,70,0.1), 0 16px 32px -18px rgba(90,80,70,0.28)';

/** ⚠ מיקומים קבועים · נקודות שמוגרלות בכל ציור קופצות בכל רינדור */
const DOTS = [
  [12, 18, 4], [28, 66, 3], [44, 12, 5], [58, 80, 3.5],
  [72, 30, 4], [88, 58, 3], [20, 88, 4.5], [80, 8, 3.5],
] as const;

export function NightSky() {
  return (
    <View style={[StyleSheet.absoluteFill, NO_TOUCH]}>
      {DOTS.map(([x, y, r], i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              left: `${x}%`,
              top: `${y}%`,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              opacity: 0.16 + (i % 3) * 0.08,
            },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  dot: { position: 'absolute', backgroundColor: LAV.dot },
});

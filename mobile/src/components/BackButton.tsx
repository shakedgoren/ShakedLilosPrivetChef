import React from 'react';
import { S } from './Sym';
import { Pressable, StyleSheet } from 'react-native';
import { iconOrbShadow } from '../theme/glass';
/**
 * חץ החזרה של המסכים הפנימיים · מרחף בפינה הימנית העליונה.
 *
 * ⚠ **המידות אינן מהקנבס.** בקנבס העיגול הוא 46×46 ב-`top: 30`.
 * שקד ביקשה שהחץ יהיה ״קטן יותר וממוקם מעט יותר למעלה״, ולכן
 * העיגול ירד ל-38 והמיקום עלה ל-22. הכותרת נשארה ב-30 כמו בקנבס —
 * היא לא הייתה חלק מהבקשה.
 *
 * עד לרכיב הזה הכפתור היה כתוב ארבע פעמים בנפרד · `CategoryHeader`,
 * `CategoryScreen`, `ChefScreen` ו-`BoxesScreen`. רק הרקע נבדל ביניהם,
 * ולכן הוא נשאר הפרמטר היחיד.
 */
const SIZE = 38;
const TOP = 22;
const SIDE = 18;
const GLYPH = 16;
const STROKE = 2;
const INK = '#6E6478';
/**
 * הגוון שממנו נגזרת הזכוכית · הסגול העמום של הקנבס.
 * ⚠ שקד ביקשה (16 בספטמבר 2026) שכל עיגול שמקיף אייקון ייראה כמו
 * בועות הזכוכית שבתמונת הייחוס. הרקע נשאר ה-`tint` של כל מסך —
 * נוסף רק הנפח והשפה הלבנה.
 */
const GLASS_RGB = '130,112,162';

type Props = {
  onPress: () => void;
  /** רקע העיגול · גוון רך של הקטגוריה */
  tint: string;
  /** גוון החץ · ברירת המחדל היא האפור של הקנבס */
  ink?: string;
  /** שלישיית ה-rgb שממנה נגזרת הזכוכית · ברירת המחדל סגול עמום */
  rgb?: string;
};

export function BackButton({ onPress, tint, ink = INK, rgb = GLASS_RGB }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.back, { backgroundColor: tint, boxShadow: iconOrbShadow(rgb) }]}
      hitSlop={10}
      accessibilityRole="button"
      /**
       * ⚠ **כיתוב לקורא מסך · אינו נראה על המסך** · הכפתור הוא
       * אייקון בלבד, ולכן VoiceOver היה מקריא אותו כ״כפתור״ ותו לא.
       * ⚠ המילה ״חזרה״ נכתבה על ידי Claude · אינה מהקנבס.
       */
      accessibilityLabel="חזרה"
    >
      <S k="chevronRight" size={GLYPH} color={ink} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  back: {
    position: 'absolute',
    top: TOP,
    right: SIDE,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

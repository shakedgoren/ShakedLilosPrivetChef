import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from '../icons';

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

type Props = {
  onPress: () => void;
  /** רקע העיגול · גוון רך של הקטגוריה */
  tint: string;
  /** גוון החץ · ברירת המחדל היא האפור של הקנבס */
  ink?: string;
};

export function BackButton({ onPress, tint, ink = INK }: Props) {
  return (
    <Pressable onPress={onPress} style={[s.back, { backgroundColor: tint }]} hitSlop={10}>
      <ChevronRight size={GLYPH} color={ink} strokeWidth={STROKE} />
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

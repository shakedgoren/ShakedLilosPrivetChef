import React from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import { photo } from '../data/photos';
import { a } from '../theme/tokens';

type Props = {
  /** שם הקובץ בלי הסיומת · למשל 'cat-couscous' */
  name?: string;
  style?: ViewStyle | ImageStyle | (ViewStyle | ImageStyle)[];
  /** גוון מציין המקום · כשאין תמונה בשם הזה */
  rgb?: string;
  /** cover ממלא את המסגרת וחותך · ברירת המחדל בכל המסכים */
  resizeMode?: 'cover' | 'contain';
};

/**
 * תמונה של שקד · נופלת בחזרה למציין מקום כשהקובץ עדיין לא הועלה.
 * שלוש תמונות מהטבלה עוד חסרות, ולכן המצב הזה חייב להישאר.
 */
export function Photo({ name, style, rgb = '130,112,162', resizeMode = 'cover' }: Props) {
  const src = name ? photo(name) : undefined;

  if (!src) {
    return (
      <View style={[s.placeholder, { borderColor: a(rgb, 0.34) }, style as ViewStyle]}>
        <Text style={[s.label, { color: a(rgb, 0.72) }]}>תמונה</Text>
      </View>
    );
  }

  return <Image source={src} style={style as ImageStyle} resizeMode={resizeMode} />;
}

const s = StyleSheet.create({
  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 9.5, letterSpacing: 0.6 },
});

import React from 'react';
import { Image, Pressable, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { photo } from '../data/photos';
import { Image as ImageIcon } from '../icons';
import { useLightbox } from './Lightbox';
import { a, deepRgbOf } from '../theme/tokens';

type Props = {
  /** שם הקובץ בלי הסיומת · למשל 'cat-couscous' */
  name?: string;
  style?: ViewStyle | ImageStyle | (ViewStyle | ImageStyle)[];
  /** גוון מציין המקום · כשאין תמונה בשם הזה */
  rgb?: string;
  /** cover ממלא את המסגרת וחותך · ברירת המחדל בכל המסכים */
  resizeMode?: 'cover' | 'contain';
  /**
   * לחיצה מגדילה את התמונה · דלוק כברירת מחדל בכל האפליקציה.
   * מכובה כשהתמונה יושבת בתוך כרטיס שכולו כפתור, כדי שהלחיצה
   * תמשיך לעשות מה שהכרטיס אמור לעשות.
   */
  zoom?: boolean;
};

/* מציין המקום בקנבס · אייקון בגודל 26 בגוון הכהה של הקטגוריה */
const MARK = 26;
const MARK_STROKE = 1.4;
const MARK_ALPHA = 0.5;
const EDGE_ALPHA = 0.34;

/**
 * תמונה של שקד · נופלת בחזרה למציין מקום כשהקובץ עדיין לא הועלה.
 * שלוש תמונות מהטבלה עוד חסרות, ולכן המצב הזה חייב להישאר.
 *
 * ⚠ מציין המקום הראה את המילה ״תמונה״ · היא לא קיימת בקנבס, שבו
 * יש רק את האייקון בתוך המסגרת המקווקוות. הוסרה כדי להתאים.
 */
export function Photo({ name, style, rgb = '130,112,162', resizeMode = 'cover', zoom = true }: Props) {
  const src = name ? photo(name) : undefined;
  const lightbox = useLightbox();

  if (!src) {
    return (
      <View style={[s.placeholder, { borderColor: a(rgb, EDGE_ALPHA) }, style as ViewStyle]}>
        <ImageIcon size={MARK} color={a(deepRgbOf(rgb), MARK_ALPHA)} strokeWidth={MARK_STROKE} />
      </View>
    );
  }

  if (!zoom || !lightbox || !name) {
    return <Image source={src} style={style as ImageStyle} resizeMode={resizeMode} />;
  }

  /**
   * ⚠ אותו סגנון לשניהם · אם התמונה מקבלת רק ‎100%‎ והעטיפה היא
   * שנושאת את המידות, אז כשהמסך לא נותן רוחב מפורש העטיפה מתכווצת
   * לאפס והתמונה נעלמת. זה הפיל את קרוסלת השף. כשהסגנון עובר
   * לשניהם התמונה שומרת על הרוחב הטבעי שלה כמו לפני העטיפה.
   */
  return (
    <Pressable onPress={() => lightbox.open(name)} style={style as ViewStyle}>
      <Image source={src} style={style as ImageStyle} resizeMode={resizeMode} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

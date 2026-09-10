import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from '../icons';
import { IS_RTL } from '../theme/rtl';

const OFF = '#C0B9CA';
const ON = '#2A2430';
/* מידות האייקון בקנבס · 13 פיקסלים, עובי 2.4 */
const GLYPH = 13;
const GLYPH_STROKE = 2.4;
const KEY = 30;
/* צבע הפלוס בקנבס · קבוע, בשונה מהמינוס שנצבע לפי הכמות */
const PLUS_INK = '#43307A';
const KEY_BG = 'rgba(130,112,162,0.09)';

/**
 * גוון הכפתורים · הקנבס צובע את הפלוס והמינוס אחרת בכל מקום.
 * במגשי הפירות שניהם בגוון הקטגוריה, ובמארזי הספיישל המינוס אפור
 * והפלוס ירוק. במקום שלושה רכיבים כמעט זהים, הכל עובר דרך כאן.
 */
export type StepperTone = {
  plusBg?: string;
  plusInk?: string;
  minusBg?: string;
  minusInk?: string;
  /** קוטר הכפתור העגול · 26 בשורת החלות, 32 בשורת הסלטים */
  key?: number;
  glyph?: number;
};

/**
 * בורר כמות · הפלוס תמיד מימין לכמות והמינוס תמיד משמאל,
 * בכל מסך באפליקציה. שקד ביקשה את זה מפורשות.
 *
 * הסדר ב-JSX הוא פלוס · כמות · מינוס, ולכן ב-RTL (`row`) הפלוס
 * נוחת בימין. אם הכיוון יתהפך אי פעם, `row-reverse` שומר על אותו
 * סידור ויזואלי — הכיוון לא נלקח מ-I18nManager אלא מ-rtl.ts.
 */
type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  /** פורש את הכפתורים לקצוות ומשאיר את הכמות באמצע · מגשי הפירות */
  wide?: boolean;
  tone?: StepperTone;
  /** חוסם את הפלוס · כשהמכסה של הסעיף מלאה */
  maxed?: boolean;
  /**
   * תוכן שמחליף את מספר הכמות באמצע · שורת הסלטים בספיישל שמה
   * שם את שם הפריט והתיאור שלו, והכמות מוצגת בתוכם.
   */
  center?: React.ReactNode;
};

export function Stepper({ value, onChange, min = 0, wide, tone, maxed, center }: Props) {
  const size = tone?.key ?? KEY;
  const glyph = tone?.glyph ?? GLYPH;
  const round = { width: size, height: size, borderRadius: size / 2 };
  const atMin = value <= min;

  return (
    <View style={[s.row, wide && s.wide]}>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={maxed}
        style={[s.key, round, { backgroundColor: tone?.plusBg ?? KEY_BG }, maxed && s.keyOff]}
        hitSlop={8}
      >
        <Plus size={glyph} color={tone?.plusInk ?? PLUS_INK} strokeWidth={GLYPH_STROKE} />
      </Pressable>

      {center ?? (
        <Text style={[s.value, wide && s.grow, { color: value === 0 ? OFF : ON }]}>{value}</Text>
      )}

      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={atMin}
        style={[s.key, round, { backgroundColor: tone?.minusBg ?? KEY_BG }, atMin && s.keyOff]}
        hitSlop={8}
      >
        <Minus size={glyph} color={atMin ? OFF : (tone?.minusInk ?? ON)} strokeWidth={GLYPH_STROKE} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: IS_RTL ? 'row' : 'row-reverse', alignItems: 'center', gap: 10 },
  /* הכפתורים נצמדים לקצוות והכמות נשארת באמצע */
  wide: { alignSelf: 'stretch', gap: 0 },
  grow: { flex: 1 },
  key: { alignItems: 'center', justifyContent: 'center' },
  keyOff: { opacity: 0.4 },
  value: { minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: '600' },
});

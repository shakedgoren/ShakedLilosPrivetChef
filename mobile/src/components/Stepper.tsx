import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { S } from './Sym';
import { IS_RTL } from '../theme/rtl';
import { iconOrbShadow } from '../theme/glass';

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
  /**
   * הגוון שממנו נגזרת הזכוכית · שלישיית rgb.
   * ⚠ שקד ביקשה (16 בספטמבר 2026) שכל עיגול שמקיף אייקון ייראה כמו
   * בועות הזכוכית שבתמונת הייחוס. הצבעים עצמם נשארים של הקנבס —
   * נוסף רק הנפח: צל פנימי בגוון, אור פנימי, ושפה לבנה דקה.
   */
  plusRgb?: string;
  minusRgb?: string;
};

/** ברירת המחדל לזכוכית · הסגול העמום של הקנבס, כמו ב-KEY_BG */
const GLASS_RGB = '130,112,162';

/**
 * בורר כמות · הפלוס תמיד מימין לכמות והמינוס תמיד משמאל,
 * בכל מסך באפליקציה. שקד ביקשה את זה מפורשות.
 *
 * הסדר ב-JSX הוא פלוס · כמות · מינוס, ולכן ב-RTL (`row`) הפלוס
 * נוחת בימין. אם הכיוון יתהפך אי פעם, `row-reverse` שומר על אותו
 * סידור ויזואלי — הכיוון לא נלקח מ-I18nManager אלא מ-rtl.ts.
 */
import { SHOWROOM } from '../showroom';

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
  /**
   * ⚠ **גרסת הראווה · 23 בספטמבר 2026** · שקד: ״הכרטיסים של ה+
   * וה- לא יהיו״. בגרסה הזו אי אפשר להזמין, ולכן בורר כמות הוא
   * הבטחה שלא נוכל לקיים. ה-`center` כן נשאר — בספיישל הוא נושא
   * את שם הפריט והתיאור, וזה תוכן ולא שליטה.
   */
  if (SHOWROOM) return center ? <>{center}</> : null;

  const size = tone?.key ?? KEY;
  const glyph = tone?.glyph ?? GLYPH;
  /**
   * ⚠ **עיגול עם אייקון בתוכו** · שקד ראתה גרסה שבה הסמל החליף גם
   * את העיגול ולא אהבה אותה (16 בספטמבר 2026). חזרה לצורה המקורית,
   * עם `plus` ו-`minus` הפשוטים במקום אלה שמגיעים עם טבעת.
   */
  const round = { width: size, height: size, borderRadius: size / 2 };
  const plusGlass = iconOrbShadow(tone?.plusRgb ?? GLASS_RGB);
  const minusGlass = iconOrbShadow(tone?.minusRgb ?? GLASS_RGB);
  const atMin = value <= min;

  return (
    <View style={[s.row, wide && s.wide]}>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={maxed}
        style={[s.key, round, { backgroundColor: tone?.plusBg ?? KEY_BG, boxShadow: plusGlass }, maxed && s.keyOff]}
        hitSlop={8}
      >
        {/* ⚠ SF Symbols · הסמלים שבחרה שקד ל-+ ול-‎- */}
        <S k="plus" size={glyph} color={tone?.plusInk ?? PLUS_INK} />
      </Pressable>

      {center ?? (
        <Text style={[s.value, wide && s.grow, { color: value === 0 ? OFF : ON }]}>{value}</Text>
      )}

      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={atMin}
        style={[s.key, round, { backgroundColor: tone?.minusBg ?? KEY_BG, boxShadow: minusGlass }, atMin && s.keyOff]}
        hitSlop={8}
      >
        <S k="minus" size={glyph} color={atMin ? OFF : (tone?.minusInk ?? ON)} />
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

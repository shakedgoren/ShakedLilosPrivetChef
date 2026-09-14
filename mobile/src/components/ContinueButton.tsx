import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowLeft } from '../icons';
import { a, radius } from '../theme/tokens';

/**
 * כפתור ״המשך״ המשותף לכל מסכי ההזמנה.
 *
 * ⚠ **לא מהקנבס.** בקנבס הכפתור הוא מלבן מלא בגובה 46 בגוון הקטגוריה
 * ב-50% שקיפות. שקד ביקשה כפתור נמוך ומסוגנן יותר, בחרה מתוך חמש
 * הצעות את ״זכוכית רכה״ וביקשה להוסיף לו את הידית הלבנה עם החץ
 * מכפתור ״להתחברות והזמנה״, וברוחב מינימלי.
 *
 * עד לשינוי הזה הכפתור היה כתוב שש פעמים בנפרד — `CategoryScreen`,
 * `CouscousScreen`, `SchnitzelScreen`, `BoxesScreen`, `ChefScreen`
 * ו-`FulfillmentFlow` (פעמיים). הרכיב הזה מחליף את כולם.
 *
 * ⚠ הידית יושבת ב-`left` פיזי ולא ב-`start`, בדיוק כמו ב-`PrimaryButton` —
 * שקד ביקשה אותה בצד שמאל, וזה אותו צד בכל הכיוונים.
 */
const H = 38;
const KNOB = 30;
const KNOB_INSET = 4;
const ARROW = 13;

/** מילוי הזכוכית · שקוף מספיק כדי שהשטיפה מאחור תעבור */
const FILL_ALPHA = 0.14;
/** מסגרת לבנה פנימית ועוד צל רך · שפת הזכוכית של האריחים */
const GLASS_EDGE = 'inset 0 0 0 1px rgba(255,255,255,0.7)';
const KNOB_SHADOW = '0 2px 6px rgba(42,36,48,0.22)';
const DISABLED_OPACITY = 0.45;

type Accent = { rgb: string; deep: string };

type Props = {
  onPress: () => void;
  accent: Accent;
  label?: string;
  disabled?: boolean;
  /** מיקום בלבד · מרווחים ויישור מהמסך הקורא, לא עיצוב הכפתור */
  style?: StyleProp<ViewStyle>;
};

export function ContinueButton({
  onPress,
  accent,
  label = 'המשך',
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        s.button,
        {
          backgroundColor: a(accent.rgb, FILL_ALPHA),
          boxShadow: `${GLASS_EDGE}, 0 2px 10px ${a(accent.rgb, 0.13)}`,
          opacity: disabled ? DISABLED_OPACITY : 1,
        },
        style,
      ]}
    >
      <Text style={[s.label, { color: accent.deep }]}>{label}</Text>

      <View style={s.knob}>
        <ArrowLeft size={ARROW} color={accent.deep} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  /* ⚠ `alignSelf: flex-start` הוא מה שנותן את הרוחב המינימלי ·
     בלעדיו הכפתור נמתח לכל השורה כשההורה הוא flex */
  button: {
    height: H,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    /* מקום לידית משמאל, וריפוד צר מימין · רוחב מינימלי */
    paddingLeft: KNOB_INSET + KNOB + 4,
    paddingRight: 14,
  },
  label: { fontSize: 15, fontWeight: '600' },
  knob: {
    position: 'absolute',
    left: KNOB_INSET,
    top: KNOB_INSET,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: KNOB_SHADOW,
  },
});

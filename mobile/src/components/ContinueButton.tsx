import React from 'react';
import { S } from './Sym';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from '../ui/text';
import { a, radius } from '../theme/tokens';
import { NO_TOUCH } from '../theme/pointerEvents';

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
/** הריפוד בקצה הטקסט · מה שקובע את רוחב הכפתור */
const PAD_END = 36;
/**
 * הרווח בין הידית עם החץ לבין הטקסט.
 * ⚠ 4 → 16 · שקד ראתה את זה ב״בחר מסלול״ וביקשה את אותו רווח
 * בכל כפתורי ״המשך״ באפליקציה, כדי שהמילים לא יהיו צמודות לחץ.
 */
const LABEL_GAP = 16;

/** מילוי הזכוכית · שקוף מספיק כדי שהשטיפה מאחור תעבור */
const FILL_ALPHA = 0.14;
/** מסגרת לבנה פנימית ועוד צל רך · שפת הזכוכית של האריחים */
const GLASS_EDGE = 'inset 0 0 0 1px rgba(255,255,255,0.7)';
const KNOB_SHADOW = '0 2px 6px rgba(42,36,48,0.22)';
const DISABLED_OPACITY = 0.45;

/**
 * מצב גרירה · ״בחר מסלול״ בפינת השף.
 *
 * ⚠ שקד ביקשה (16 בספטמבר 2026) ש**שם** הידית תשב בצד ימין, ושגרירה
 * שמאלה תמלא את הכפתור בצבע ותעביר לדף הבא — בדיוק כמו בכפתור
 * הכניסה במסך הבית. שאר כפתורי ״המשך״ באפליקציה נשארים לחיצה
 * רגילה, ולכן זו תוספת מצב ולא שינוי גורף.
 */
/** רוחב הכפתור במצב גרירה · צריך מסלול קבוע כדי שיהיה מה לגרור */
const DRAG_W = 190;
/** מאיזה חלק מהמסלול זו השלמה · זהה לכפתור הכניסה */
const DONE_AT = 0.62;
const SNAP_MS = 170;
const BACK_MS = 260;
/** מתחת לזה זו לחיצה ולא גרירה */
const TAP_PX = 6;

type Accent = { rgb: string; deep: string };

type Props = {
  onPress: () => void;
  accent: Accent;
  label?: string;
  disabled?: boolean;
  /**
   * ⚠ כפתור רחב וממורכז · שקד ביקשה את זה בחלוניות של מגשי הפירות.
   * במקום הרוחב המינימלי הכפתור נמתח לכל השורה.
   */
  wide?: boolean;
  /**
   * גרירה במקום לחיצה · הידית עוברת לימין, מושכים שמאלה, הכפתור
   * מתמלא בצבע וממשיך. בקשה של שקד עבור ״בחר מסלול״ בפינת השף.
   */
  drag?: boolean;
  /** מיקום בלבד · מרווחים ויישור מהמסך הקורא, לא עיצוב הכפתור */
  style?: StyleProp<ViewStyle>;
};

export function ContinueButton({
  onPress,
  accent,
  label = 'המשך',
  disabled = false,
  wide = false,
  drag = false,
  style,
}: Props) {
  if (drag) return <DragButton onPress={onPress} accent={accent} label={label} disabled={disabled} style={style} />;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        s.button,
        wide && s.wide,
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
        <S k="arrowLeft" size={ARROW} color={accent.deep} />
      </View>
    </Pressable>
  );
}

/**
 * גרסת הגרירה · הידית מימין, מושכים שמאלה, הכפתור מתמלא וממשיך.
 *
 * ⚠ **`View` ולא `Pressable`** · נמדד בכפתור הכניסה שכש-`panHandlers`
 * נפרשׂ על `Pressable` המחוון של הלחיצה גובר, הידית לא זזה כלל, ומה
 * שרץ הוא לחיצה רגילה. לכן הלחיצה מטופלת כאן בתוך שחרור המחווה.
 */
function DragButton({
  onPress,
  accent,
  label,
  disabled,
  style,
}: Omit<Props, 'wide' | 'drag' | 'label'> & { label: string }) {
  const travel = DRAG_W - KNOB - KNOB_INSET * 2;
  const x = React.useRef(new Animated.Value(0)).current;
  const done = React.useRef(false);

  const springBack = React.useCallback(() => {
    Animated.timing(x, {
      toValue: 0,
      duration: BACK_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      done.current = false;
    });
  }, [x]);

  const complete = React.useCallback(() => {
    if (done.current || disabled) return;
    done.current = true;
    Animated.timing(x, {
      toValue: -travel,
      duration: SNAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onPress();
      springBack();
    });
  }, [disabled, onPress, springBack, travel, x]);

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: (_e, g) =>
          !disabled && Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 3,
        onPanResponderMove: (_e, g) => {
          if (done.current) return;
          x.setValue(Math.max(-travel, Math.min(0, g.dx)));
        },
        onPanResponderRelease: (_e, g) => {
          if (done.current) return;
          if (-g.dx >= travel * DONE_AT) complete();
          else if (Math.abs(g.dx) < TAP_PX && Math.abs(g.dy) < TAP_PX) complete();
          else springBack();
        },
        onPanResponderTerminate: () => springBack(),
      }),
    [complete, disabled, springBack, travel, x],
  );

  /* המילוי נכנס מימין ככל שהידית מתקדמת שמאלה */
  const fill = x.interpolate({
    inputRange: [-travel, 0],
    outputRange: [0, DRAG_W],
    extrapolate: 'clamp',
  });
  const labelOpacity = x.interpolate({
    inputRange: [-travel * 0.55, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="גוררים את החץ שמאלה, או לוחצים"
      onAccessibilityTap={complete}
      style={[
        s.button,
        s.dragBox,
        {
          backgroundColor: a(accent.rgb, FILL_ALPHA),
          boxShadow: `${GLASS_EDGE}, 0 2px 10px ${a(accent.rgb, 0.13)}`,
          opacity: disabled ? DISABLED_OPACITY : 1,
        },
        style,
      ]}
      {...pan.panHandlers}
    >
      <Animated.View
        style={[
          s.fill,
          NO_TOUCH,
          { backgroundColor: a(accent.rgb, 0.55), transform: [{ translateX: fill }] },
        ]}
      />
      <Animated.Text style={[s.label, { color: accent.deep, opacity: labelOpacity }]}>
        {label}
      </Animated.Text>

      {/* ⚠ הידית מימין · זו הבקשה. `right` פיזי, כמו בכפתור הכניסה. */}
      <Animated.View style={[s.knob, s.knobRight, { transform: [{ translateX: x }] }]}>
        <S k="arrowLeft" size={ARROW} color={accent.deep} />
      </Animated.View>
    </View>
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
    /* מקום לידית משמאל, וריפוד מימין · שקד ביקשה ״מעט רוחב״
       פעמיים: 14 → 24, ואז 24 → 36. */
    paddingLeft: KNOB_INSET + KNOB + LABEL_GAP,
    paddingRight: PAD_END,
  },
  /* רחב וממורכז · `alignSelf: stretch` מבטל את הרוחב המינימלי */
  wide: { alignSelf: 'stretch', width: '100%' },
  /* מצב גרירה · רוחב קבוע, והריפוד מתבטל כי הידית עברה לימין */
  dragBox: {
    width: DRAG_W,
    alignSelf: 'center',
    paddingLeft: 0,
    paddingRight: KNOB_INSET + KNOB + LABEL_GAP,
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  label: { fontSize: 15, fontWeight: '600' },
  knobRight: { left: undefined, right: KNOB_INSET },
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

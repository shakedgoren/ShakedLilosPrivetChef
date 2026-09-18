import React from 'react';
import { S } from '../../components/Sym';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { Text } from '../../ui/text';
import { surface } from '../../theme/tokens';
import { iconOrbShadow } from '../../theme/glass';
import { PASS_TOUCH } from '../../theme/pointerEvents';
type Props = {
  title: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** מיקום החלונית · בקנבס לכל חלונית מרווח משלה */
  style?: ViewStyle;
  /**
   * כותרת ממורכזת · כך היא בקנבס בכמה חלוניות, ובהזמנה הידנית
   * שקד ביקשה אותה במפורש (15 בספטמבר 2026).
   * ⚠ הריפוד מקזז את כפתור הסגירה · בלעדיו ה״מרכז״ נדחף הצידה.
   */
  centerTitle?: boolean;
};

/** רווח בין תחתית הכרטיס לראש המקלדת */
const KEY_GAP = 12;
/** ⚠ ב-iOS האירוע מגיע **לפני** התנועה · באנדרואיד רק אחריה */
const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/** חלונית מודאלית · הכיסוי המעומעם, הכרטיס הלבן וכפתור הסגירה */
export function Sheet({ title, sub, onClose, children, style, centerTitle = false }: Props) {
  /**
   * ⚠ **הרמה מעל המקלדת · 18 בספטמבר 2026** · בחלוניות האלה יש
   * טפסים — הזמנה ידנית, פריט מלאי, פריט קניות, ביטול הזמנה — ולא
   * הייתה בהן שום התחמקות ממקלדת. הכרטיס ממורכז בגובה, והמקלדת
   * פשוט כיסתה את החלק התחתון שלו יחד עם כפתור השמירה.
   *
   * ⚠ **לא `KeyboardAvoidingView`** · הוא עובד על פריסת flex, והכרטיס
   * כאן **ממוקם מוחלט** (כל קורא נותן לו מיקום אנכי משלו). החלפת
   * הפריסה הייתה נוגעת בשמונה מקומות; ההרמה נוגעת באחד.
   *
   * ⚠ **מרימים רק את מה שחסר** · אם הכרטיס ממילא מעל המקלדת, אין
   * תנועה בכלל.
   */
  const lift = React.useRef(new Animated.Value(0)).current;
  const box = React.useRef({ y: 0, h: 0 });

  const onCardLayout = React.useCallback((e: LayoutChangeEvent) => {
    box.current = { y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height };
  }, []);

  React.useEffect(() => {
    const move = (to: number, duration: number) =>
      Animated.timing(lift, { toValue: to, duration, useNativeDriver: true }).start();

    const show = Keyboard.addListener(SHOW_EVENT, (e) => {
      const over = box.current.y + box.current.h + KEY_GAP - e.endCoordinates.screenY;
      move(over > 0 ? -over : 0, e.duration || 250);
    });
    const hide = Keyboard.addListener(HIDE_EVENT, (e) => move(0, e.duration || 250));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [lift]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      <Animated.View
        onLayout={onCardLayout}
        style={[s.card, style, PASS_TOUCH, { transform: [{ translateY: lift }] }]}
      >
        <View style={s.head}>
          {/* ⚠ **מרווח מראה** · כדי שהכותרת תשב במרכז **הכרטיס**
              ולא במרכז השטח שנשאר לצד כפתור הסגירה. ניסיתי קודם
              `paddingStart` ונמדד בדפדפן שהכותרת עדיין סטתה 21
              פיקסלים ימינה. */}
          {centerTitle ? <View style={s.mirror} /> : null}
          <View style={[s.headText, centerTitle && s.headCenter]}>
            <Text style={[s.title, centerTitle && s.titleCenter]}>{title}</Text>
            {sub ? <Text style={s.sub}>{sub}</Text> : null}
          </View>
          <Pressable onPress={onClose} style={s.close} hitSlop={8}>
            <S k="close" size={13} color="#6E6478" />
          </Pressable>
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(42,36,48,0.34)',
  },
  headCenter: { alignItems: 'center' },
  mirror: { width: 32, height: 32 },
  titleCenter: { textAlign: 'center' },
  card: {
    position: 'absolute',
    right: 16,
    left: 16,
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#FEFCFB',
    elevation: 12,
    boxShadow: '0px 20px 30px rgba(60,48,84,0.4)',
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headText: { flex: 1, gap: 2 },
  title: { fontSize: 19.5, fontWeight: '600', color: surface.ink },
  sub: { fontSize: 14, color: surface.muted, marginTop: 2 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  boxShadow: iconOrbShadow('130,112,162'),
  },
  closeGlyph: { fontSize: 15, color: '#6E6478', lineHeight: 16 },
});

import React from 'react';
import { S } from '../../components/Sym';
import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { surface } from '../../theme/tokens';
import { iconOrbShadow } from '../../theme/glass';
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

/** חלונית מודאלית · הכיסוי המעומעם, הכרטיס הלבן וכפתור הסגירה */
export function Sheet({ title, sub, onClose, children, style, centerTitle = false }: Props) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={[s.card, style]} pointerEvents="box-none">
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
      </View>
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
    shadowColor: '#3C3054',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headText: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '600', color: surface.ink },
  sub: { fontSize: 12, color: surface.muted, marginTop: 2 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  boxShadow: iconOrbShadow('130,112,162'),
  },
  closeGlyph: { fontSize: 13, color: '#6E6478', lineHeight: 16 },
});

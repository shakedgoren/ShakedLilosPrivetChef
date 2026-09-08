import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { a, radius, space, surface } from '../theme/tokens';
import type { Accent } from '../order/types';

/**
 * חסם ההתחברות · נפתח כשלוחצים ״המשך״ בלי חשבון.
 * חל על קוסקוס, שישניצל, ספיישל ופירות. שף וטאבון פתוח עד הסוף.
 */
type Props = { visible: boolean; accent: Accent; onCancel: () => void; onLogin: () => void };

export function LoginGate({ visible, accent, onCancel, onLogin }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.scrim} onPress={onCancel}>
        <View style={s.sheet}>
          <Text style={s.title}>צריך להתחבר כדי להמשיך</Text>
          <Text style={s.body}>הבחירות שלך נשמרות · אחרי ההתחברות חוזרים בדיוק לכאן.</Text>
          <View style={s.row}>
            <Pressable onPress={onCancel} style={[s.btn, s.ghost]}>
              <Text style={s.ghostText}>ביטול</Text>
            </Pressable>
            <Pressable onPress={onLogin} style={[s.btn, { backgroundColor: a(accent.rgb, 0.5) }]}>
              <Text style={[s.solidText, { color: accent.deep }]}>להתחברות</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(42,36,48,0.34)', justifyContent: 'center', padding: 30 },
  sheet: { borderRadius: radius.card, padding: 22, backgroundColor: '#FEFCFB', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  body: { fontSize: 13, color: surface.muted, textAlign: 'center', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 9, marginTop: space.md, alignSelf: 'stretch' },
  btn: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ghost: { backgroundColor: 'rgba(130,112,162,0.09)' },
  ghostText: { fontSize: 14, fontWeight: '600', color: surface.inkSoft },
  solidText: { fontSize: 14, fontWeight: '600' },
});

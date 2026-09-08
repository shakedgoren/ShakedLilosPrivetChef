import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, surface } from '../theme/tokens';

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * אישור התנתקות · אותם טקסטים מ-MyOrders.dc.html ו-Profile.dc.html.
 */
export function LogoutConfirm({ open, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.scrim} onPress={onCancel}>
        <Pressable style={s.card} onPress={() => {}}>
          <Text style={s.title}>להתנתק מהחשבון?</Text>
          <Text style={s.body}>ההזמנות והפרטים שלך יישמרו. תוכלי להיכנס שוב מתי שתרצי.</Text>
          <View style={s.row}>
            <Pressable onPress={onCancel} style={s.cancel}>
              <Text style={s.cancelText}>ביטול</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={s.ok}>
              <Text style={s.okText}>התנתקות</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(42,36,48,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  card: {
    width: '100%',
    borderRadius: 26,
    padding: 22,
    backgroundColor: '#FEFCFB',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  body: { fontSize: 13, fontWeight: '300', color: surface.muted, textAlign: 'center', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 9, marginTop: 12, width: '100%' },
  cancel: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#4A4254' },
  ok: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(185,83,73,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(185,83,73,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: { fontSize: 14, fontWeight: '600', color: '#B95349' },
});

import React from 'react';
import { S } from '../components/Sym';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';

/**
 * ״האישור נשלח ללקוח״.
 *
 * ⚠ **אינה מהקנבס** · שקד ביקשה (15 בספטמבר 2026) שאחרי שמירת
 * הזמנה ידנית יקפוץ לה אישור שההודעה יצאה ללקוח.
 *
 * ⚠ **הטקסט נכתב על ידי** · תגידי מילה ואשנה.
 */

const DISC = 62;

type Props = {
  /** שם הלקוח או הטלפון שלו · ריק = החלונית סגורה */
  who: string;
  onClose: () => void;
};

export function SentNotice({ who, onClose }: Props) {
  if (!who) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.card} pointerEvents="box-none">
        <View style={s.disc}>
          <S k="check" size={28} color="#FFFFFF" />
        </View>
        <Text style={s.title}>אישור נשלח ללקוח</Text>
        <Text style={s.body}>{`פרטי ההזמנה נשלחו ל${who} בוואטסאפ.`}</Text>
        <Pressable onPress={onClose} style={s.cta}>
          <Text style={s.ctaText}>סגירה</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(42,36,48,0.34)' },
  card: {
    position: 'absolute',
    top: '32%',
    right: 34,
    left: 34,
    borderRadius: 26,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEFCFB',
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    backgroundColor: '#4E8A64',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: '600', color: surface.ink },
  body: { fontSize: 12.5, fontWeight: '300', color: surface.muted, textAlign: 'center' },
  cta: {
    height: 42,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: '#C6B3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  ctaText: { fontSize: 14, fontWeight: '600', color: '#43307A' },
});

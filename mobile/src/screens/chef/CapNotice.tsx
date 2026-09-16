import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { radius } from '../../theme/tokens';
import { PASS_TOUCH } from '../../theme/pointerEvents';

/**
 * חלונית ״נבחרה הכמות המקסימלית״ · המידות מ-`Chef.dc.html` (noticeOpen):
 * מסך 0.34 עם טשטוש 7, לוח ב-top 240 ובריפוד 30 מהצדדים, פינה 26,
 * ריפוד 22/20, רקע `#FEFCFB`, מרווח 7, וכפתור ״הבנתי״ בגובה 46.
 *
 * ⚠ היא **מחליפה נעילה** · קודם כל אפשרות מעבר למכסה הייתה חסומה,
 * ושקד ביקשה שהכל יישאר פתוח והחלונית רק תסביר שזה שדרוג בתשלום.
 */
export function CapNotice({ note, onClose }: { note: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!note} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={[s.panel, PASS_TOUCH]}>
        <View style={s.card}>
          <Text style={s.head}>נבחרה הכמות המקסימלית,</Text>
          <Text style={s.body}>{note}</Text>
          <Pressable onPress={onClose} style={s.cta}>
            <Text style={s.ctaText}>הבנתי</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(42,36,48,0.34)' },
  /* הלוח יושב ב-240 מלמעלה, כמו בקנבס */
  panel: { position: 'absolute', top: 240, right: 30, left: 30 },
  card: {
    borderRadius: 26,
    paddingVertical: 22,
    paddingHorizontal: 20,
    backgroundColor: '#FEFCFB',
    boxShadow: '0 26px 60px -22px rgba(60,48,84,0.72)',
    alignItems: 'center',
    gap: 7,
  },
  head: { fontSize: 14.5, fontWeight: '600', color: '#2A2430', textAlign: 'center', lineHeight: 20.3 },
  body: { fontSize: 13, fontWeight: '400', color: '#6B3F22', textAlign: 'center', lineHeight: 19.5 },
  cta: {
    alignSelf: 'center',
    height: 46,
    marginTop: 10,
    paddingHorizontal: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    /* הגרדיאנט של כפתורי הפעולה בשף · שני עוצרים, ולכן רקע שטוח לא מספיק */
    backgroundColor: '#EACAAB',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.5), 0 12px 24px -14px rgba(150,100,55,0.75)',
  },
  ctaText: { color: '#7A3D18', fontWeight: '600', fontSize: 15 },
});

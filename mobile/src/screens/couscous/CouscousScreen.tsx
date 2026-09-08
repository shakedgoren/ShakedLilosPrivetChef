import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COUSCOUS_MENU } from '../../data/couscous';
import { Stepper } from '../../components/Stepper';
import { hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useCouscousOrder, STEP } from './useCouscousOrder';
import { OrderFlow } from './OrderFlow';

const INK = hues.cous.deep;

/** שלישי של קוסקוס · בחירת מנות, סיכום, וזרימת ההזמנה */
export function CouscousScreen() {
  const { back, go, loggedIn } = useNav();
  const o = useCouscousOrder();
  const [gate, setGate] = useState(false);

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (o.total > 0) o.setStep(STEP.ship);
  };

  return (
    <View style={s.page}>
      <Pressable onPress={back} style={s.back} hitSlop={8}>
        <Text style={s.backGlyph}>›</Text>
      </Pressable>

      <View style={s.head}>
        <Text style={s.title}>שלישי של קוסקוס</Text>
        <Text style={s.date}>שלישי · 25 באוגוסט</Text>
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {COUSCOUS_MENU.map((it, i) => (
          <View key={it.name} style={s.row}>
            <View style={s.rowText}>
              <Text style={s.name}>{it.name}</Text>
              <Text style={s.price}>{it.price} ₪</Text>
            </View>
            <Stepper value={o.qty[i]} onChange={(n) => o.bump(i, n - o.qty[i])} />
          </View>
        ))}
      </ScrollView>

      <View style={s.bar}>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>סה״כ :</Text>
          <Text style={s.total}>{o.total}</Text>
          <Text style={s.currency}>₪</Text>
        </View>
        <Pressable
          onPress={onContinue}
          disabled={o.total === 0}
          style={[s.cta, { opacity: o.total === 0 ? 0.45 : 1 }]}
        >
          <Text style={s.ctaText}>המשך</Text>
        </Pressable>
      </View>

      <OrderFlow o={o} onHome={() => { o.reset(); go(loggedIn ? 'main' : 'guest'); }} />

      <Modal visible={gate} transparent animationType="fade" onRequestClose={() => setGate(false)}>
        <Pressable style={s.scrim} onPress={() => setGate(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>צריך להתחבר כדי להמשיך</Text>
            <Text style={s.sheetBody}>הבחירות שלך נשמרות · אחרי ההתחברות חוזרים בדיוק לכאן.</Text>
            <View style={s.sheetRow}>
              <Pressable onPress={() => setGate(false)} style={[s.sheetBtn, s.ghost]}>
                <Text style={s.ghostText}>ביטול</Text>
              </Pressable>
              <Pressable onPress={() => { setGate(false); go('login'); }} style={[s.sheetBtn, s.solid]}>
                <Text style={s.solidText}>להתחברות</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground, paddingHorizontal: space.lg, paddingTop: 88 },
  back: {
    position: 'absolute', top: 30, right: 18, width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center',
  },
  backGlyph: { fontSize: 24, color: '#6E6478', lineHeight: 26 },
  head: { alignItems: 'center', gap: 2 },
  title: { fontSize: 20, fontWeight: '600', color: surface.ink },
  date: { fontSize: type.label, color: '#7A7080' },

  list: { paddingVertical: space.lg, gap: space.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    borderRadius: 20, padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(130,112,162,0.14)',
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 15.5, fontWeight: '500', color: surface.ink },
  price: { fontSize: type.label, color: surface.muted },

  bar: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: space.md, marginBottom: 30,
  },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: {
    height: 46, paddingHorizontal: 18, borderRadius: radius.pill,
    backgroundColor: '#BCA7E6', alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { fontSize: 15.5, fontWeight: '600', color: INK },

  scrim: { flex: 1, backgroundColor: 'rgba(42,36,48,0.34)', justifyContent: 'center', padding: 30 },
  sheet: { borderRadius: radius.card, padding: 22, backgroundColor: '#FEFCFB', alignItems: 'center', gap: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  sheetBody: { fontSize: 13, color: surface.muted, textAlign: 'center', lineHeight: 20 },
  sheetRow: { flexDirection: 'row', gap: 9, marginTop: space.md, alignSelf: 'stretch' },
  sheetBtn: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ghost: { backgroundColor: 'rgba(130,112,162,0.09)' },
  ghostText: { fontSize: 14, fontWeight: '600', color: surface.inkSoft },
  solid: { backgroundColor: '#BCA7E6' },
  solidText: { fontSize: 14, fontWeight: '600', color: INK },
});

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COUSCOUS_FULFILLMENT, COUSCOUS_MENU } from '../../data/couscous';
import { SALE_DATE } from '../../data/shared';
import { CategoryHeader } from '../../components/CategoryHeader';
import { LoginGate } from '../../components/LoginGate';
import { Stepper } from '../../components/Stepper';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useCouscousOrder } from './useCouscousOrder';

const ACCENT = hues.cous;

/** שלישי של קוסקוס · בחירת מנות ואז זרימת המסירה המשותפת */
export function CouscousScreen() {
  const { go, loggedIn } = useNav();
  const o = useCouscousOrder();
  const f = useFulfillment({ ...COUSCOUS_FULFILLMENT, meals: o.meals });
  const [gate, setGate] = useState(false);

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (o.total > 0) f.open();
  };

  return (
    <View style={s.page}>
      <CategoryHeader title="שלישי של קוסקוס" date={SALE_DATE} />

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
          style={[s.cta, { backgroundColor: a(ACCENT.rgb, 0.5), opacity: o.total === 0 ? 0.45 : 1 }]}
        >
          <Text style={[s.ctaText, { color: ACCENT.deep }]}>המשך</Text>
        </Pressable>
      </View>

      <FulfillmentFlow
        f={f}
        lines={o.lines}
        total={o.total}
        accent={ACCENT}
        details={{ category: 'cous', qty: o.qty }}
        onHome={() => {
          f.reset();
          go(loggedIn ? 'main' : 'guest');
        }}
      />

      <LoginGate
        visible={gate}
        accent={ACCENT}
        onCancel={() => setGate(false)}
        onLogin={() => {
          setGate(false);
          go('login');
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground, paddingHorizontal: space.lg, paddingTop: 88 },
  list: { paddingVertical: space.lg, gap: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.14)',
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 15.5, fontWeight: '500', color: surface.ink },
  price: { fontSize: type.label, color: surface.muted },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: { height: 46, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },
});

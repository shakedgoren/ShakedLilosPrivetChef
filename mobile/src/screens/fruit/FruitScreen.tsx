import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FRUIT_FULFILLMENT, FRUIT_TRAYS } from '../../data/fruit';
import { TRAY_PHOTOS } from '../../data/photos';
import { CategoryHeader } from '../../components/CategoryHeader';
import { Photo } from '../../components/Photo';
import { LoginGate } from '../../components/LoginGate';
import { Stepper } from '../../components/Stepper';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import type { OrderLine } from '../../order/types';

const ACCENT = hues.fruit;

/** מגשי פירות · בחירת מגשים ואז זרימת המסירה המשותפת */
export function FruitScreen() {
  const { go, loggedIn } = useNav();
  const [qty, setQty] = useState<number[]>(() => FRUIT_TRAYS.map(() => 0));
  const f = useFulfillment(FRUIT_FULFILLMENT);
  const [gate, setGate] = useState(false);

  const bump = (i: number, next: number) =>
    setQty((prev) => prev.map((v, k) => (k === i ? Math.max(0, next) : v)));

  const total = qty.reduce((s, v, i) => s + v * FRUIT_TRAYS[i].price, 0);

  const lines: OrderLine[] = useMemo(
    () =>
      FRUIT_TRAYS.map((t, i) => ({ name: t.name, qty: qty[i], sum: qty[i] * t.price })).filter(
        (l) => l.qty > 0,
      ),
    [qty],
  );

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (total > 0) f.open();
  };

  return (
    <View style={s.page}>
      <CategoryHeader title="מגשי פירות" date="בעבודת יד" />

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {FRUIT_TRAYS.map((t, i) => (
          <View key={t.name} style={s.card}>
            <Photo name={TRAY_PHOTOS[i]} rgb={ACCENT.rgb} style={s.shot} />
            <View style={s.text}>
              <Text style={s.name}>{t.name}</Text>
              <Text style={s.desc}>{t.desc}</Text>
              <View style={s.foot}>
                <Text style={s.price}>{t.price} ₪</Text>
                <View style={s.grow} />
                <Stepper value={qty[i]} onChange={(n) => bump(i, n)} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={s.bar}>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>סה״כ :</Text>
          <Text style={s.total}>{total}</Text>
          <Text style={s.currency}>₪</Text>
        </View>
        <Pressable
          onPress={onContinue}
          disabled={total === 0}
          style={[s.cta, { backgroundColor: a(ACCENT.rgb, 0.5), opacity: total === 0 ? 0.45 : 1 }]}
        >
          <Text style={[s.ctaText, { color: ACCENT.deep }]}>המשך</Text>
        </Pressable>
      </View>

      <FulfillmentFlow
        f={f}
        lines={lines}
        total={total}
        accent={ACCENT}
        details={{ category: 'fruit', qty }}
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
  card: {
    flexDirection: 'row',
    gap: space.md,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.14)',
  },
  shot: { width: 84, height: 84, borderRadius: radius.field, overflow: 'hidden' },
  text: { flex: 1, gap: 4 },
  name: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  desc: { fontSize: 12, color: surface.muted, lineHeight: 17 },
  foot: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  price: { fontSize: type.label, fontWeight: '600', color: ACCENT.deep },
  grow: { flex: 1 },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: { height: 46, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },
});

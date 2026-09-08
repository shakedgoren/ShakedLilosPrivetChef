import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  BY_APPOINTMENT,
  CARD,
  DISCLAIMER,
  FRUIT_FULFILLMENT,
  FRUIT_HOURS,
  FRUIT_TITLE,
  FRUIT_TRAYS,
  INTRO_BODY,
  INTRO_TITLE,
  PHONE_HREF,
  PHONE_LABEL,
} from '../../data/fruit';
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
  /* רוחב הכרטיס נמדד · בקנבס הנוסחה היא (100% − רווח) ÷ 2, ול-RN אין calc */
  const [gridW, setGridW] = useState(0);
  const cardW = gridW ? (gridW - CARD.gap) / 2 : undefined;

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
      <CategoryHeader title={FRUIT_TITLE} />

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        <Text style={s.hours}>{FRUIT_HOURS}</Text>
        <Text style={s.hours}>{BY_APPOINTMENT}</Text>

        <Text style={s.introTitle}>{INTRO_TITLE}</Text>
        <Text style={s.introBody}>{INTRO_BODY}</Text>
        <Text style={s.disclaimer}>{DISCLAIMER}</Text>

        <Pressable onPress={() => Linking.openURL(PHONE_HREF)} style={s.phone}>
          <Text style={s.phoneText}>{PHONE_LABEL}</Text>
        </Pressable>

        {/* שתי עמודות · בדיוק כמו רשת הכרטיסים בקנבס */}
        <View style={s.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
          {FRUIT_TRAYS.map((t, i) => (
            <View key={t.name} style={[s.card, { width: cardW }, qty[i] > 0 && s.cardOn]}>
              <Photo name={TRAY_PHOTOS[i]} rgb={ACCENT.rgb} style={s.shot} />
              <Text style={[s.name, qty[i] > 0 && s.nameOn]}>{t.name}</Text>
              <Text style={s.desc}>{t.desc}</Text>
              <Text style={s.serves}>{t.serves}</Text>
              <View style={s.grow} />
              <Text style={s.price}>{t.price} ₪</Text>
              <Stepper value={qty[i]} onChange={(n) => bump(i, n)} />
            </View>
          ))}
        </View>
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
  list: { paddingVertical: space.lg, gap: 6 },
  hours: { fontSize: 12, color: '#7A7080', textAlign: 'center' },

  introTitle: { fontSize: 15, fontWeight: '600', color: surface.ink, marginTop: 10, lineHeight: 20 },
  introBody: { fontSize: 13, fontWeight: '300', lineHeight: 21, color: surface.inkSoft },
  disclaimer: { fontSize: 11, fontWeight: '300', lineHeight: 16, color: surface.faint },
  phone: {
    alignSelf: 'center',
    marginTop: 6,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: a(ACCENT.rgb, 0.1),
  },
  phoneText: { fontSize: 14.5, fontWeight: '700', color: ACCENT.deep },

  /* שתי עמודות · הרוחב הוא חצי פחות חצי מהרווח */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD.gap, marginTop: 16 },
  card: {
    borderRadius: CARD.radius,
    padding: CARD.padding,
    gap: CARD.inner,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.14)',
  },
  cardOn: { backgroundColor: a(ACCENT.rgb, 0.1), borderColor: a(ACCENT.rgb, 0.42) },
  shot: { width: '100%', height: CARD.shotHeight, borderRadius: CARD.shotRadius, overflow: 'hidden' },
  name: { fontSize: 13.5, fontWeight: '500', color: surface.ink, lineHeight: 18 },
  nameOn: { fontWeight: '700', color: ACCENT.deep },
  desc: { fontSize: 10.5, fontWeight: '300', lineHeight: 15, color: surface.muted },
  serves: { fontSize: 10.5, fontWeight: '400', lineHeight: 15, color: surface.muted },
  price: { fontSize: 12.5, fontWeight: '600', color: ACCENT.deep, paddingTop: 2 },
  grow: { flex: 1 },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: { height: 46, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },
});

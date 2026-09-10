import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COUSCOUS_FULFILLMENT, COUSCOUS_MENU } from '../../data/couscous';
import { SALE_DATE } from '../../data/shared';
import { CategoryHeader } from '../../components/CategoryHeader';
import { LoginGate } from '../../components/LoginGate';
import { Photo } from '../../components/Photo';
import { Stepper } from '../../components/Stepper';
import { COUSCOUS_PHOTOS } from '../../data/photos';
import {
  ADDONS_LABEL,
  ADDON_CARD,
  COUSCOUS_DATE,
  COUSCOUS_INTRO,
  COUSCOUS_TITLE,
  DISH_ROW,
  INTRO_GAP,
  LIST_GAP,
  PICKLE_NOTE,
  TOTAL_LABEL,
  mealsLabel,
} from '../../data/couscousCopy';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useCouscousOrder } from './useCouscousOrder';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

const ACCENT = hues.cous;

/** שלישי של קוסקוס · בחירת מנות ואז זרימת המסירה המשותפת */
export function CouscousScreen() {
  const { go, loggedIn } = useNav();
  const o = useCouscousOrder();
  const f = useFulfillment({ ...COUSCOUS_FULFILLMENT, meals: o.meals });
  const [gate, setGate] = useState(false);
  const [gridW, setGridW] = useState(0);

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (o.total > 0) f.open();
  };

  /* המנות והתוספות מוצגות בנפרד · בקנבס אלה שני בלוקים שונים */
  const meals = COUSCOUS_MENU.map((it, i) => ({ it, i })).filter((x) => x.it.meal);
  const addons = COUSCOUS_MENU.map((it, i) => ({ it, i })).filter((x) => !x.it.meal);
  const addonW = gridW
    ? (gridW - ADDON_CARD.gap * (ADDON_CARD.columns - 1)) / ADDON_CARD.columns
    : undefined;
  /* גובה מפורש · aspectRatio על <Image> לא נתפס ב-React Native Web
     והתמונה נמתחה לפס אנכי שמראה רק את השולחן מסביב לקערה */
  const addonShotSize = addonW ? addonW - ADDON_CARD.padding * 2 : undefined;

  return (
    <View style={s.page}>
      <CategoryHeader title={COUSCOUS_TITLE} date={COUSCOUS_DATE} />

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        <Text style={s.intro}>{COUSCOUS_INTRO}</Text>

        {/* המנות · שורה עם תמונה 58×58 */}
        {meals.map(({ it, i }) => (
          <View key={it.name} style={s.row}>
            <Photo name={COUSCOUS_PHOTOS[i]} rgb={ACCENT.rgb} style={s.shot} />
            <View style={s.rowText}>
              <Text style={s.name}>{it.name}</Text>
              <Text style={s.price}>{it.price} ₪</Text>
            </View>
            <Stepper value={o.qty[i]} onChange={(n) => o.bump(i, n - o.qty[i])} />
          </View>
        ))}

        <Text style={s.pickle}>{PICKLE_NOTE}</Text>
        <Text style={s.addonsLabel}>{ADDONS_LABEL}</Text>

        {/* התוספות · שלוש עמודות בלי תמונה, כמו בקנבס */}
        <View style={s.addonGrid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
          {addons.map(({ it, i }) => (
            <View key={it.name} style={[s.addon, { width: addonW }]}>
              {/* התמונה יושבת בתוך הכרטיס מעל השם · שקד ביקשה, אין כזו בקנבס */}
              <Photo
                name={COUSCOUS_PHOTOS[i]}
                rgb={ACCENT.rgb}
                style={[s.addonShot, { width: addonShotSize, height: addonShotSize }]}
              />
              <Text style={s.addonName}>{it.name}</Text>
              <Text style={s.addonPrice}>{it.price} ₪</Text>
              <Stepper value={o.qty[i]} onChange={(n) => o.bump(i, n - o.qty[i])} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.bar}>
        <View style={s.totalBox}>
          <Text style={s.mealsCount}>{mealsLabel(o.meals)}</Text>
          <Text style={s.totalLabel}>·</Text>
          <Text style={s.totalLabel}>{TOTAL_LABEL}</Text>
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
  /* התיאור · ממורכז, בדיוק כמו text-align: center בקנבס */
  intro: {
    fontSize: 13.5,
    fontWeight: '300',
    lineHeight: 22,
    color: surface.muted,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: INTRO_GAP,
  },
  pickle: { fontSize: 12.5, fontWeight: '300', color: surface.muted, marginTop: 4 },
  addonsLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 2.3,
    color: surface.faint,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  addonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ADDON_CARD.gap },
  addon: {
    borderRadius: ADDON_CARD.radius,
    padding: ADDON_CARD.padding,
    gap: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
  },
  addonShot: { borderRadius: ADDON_CARD.shotRadius, overflow: 'hidden', marginBottom: 2 },
  addonName: { fontSize: 12.5, fontWeight: '600', lineHeight: 15, textAlign: 'center', color: surface.ink },
  addonPrice: { fontSize: 12, fontWeight: '600', color: ACCENT.hue },

  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: 88 },
  list: { paddingBottom: space.lg, gap: LIST_GAP },
  row: {
    height: DISH_ROW.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: DISH_ROW.radius,
    paddingHorizontal: DISH_ROW.padding,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
  },
  shot: { width: DISH_ROW.shotSize, height: DISH_ROW.shotSize, borderRadius: DISH_ROW.shotRadius, overflow: 'hidden' },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 15.5, fontWeight: '600', lineHeight: 18.6, color: surface.ink },
  /* המחיר · 13.5 בגוון הקטגוריה ובמשקל 600 · כך הוא בקנבס */
  price: { fontSize: 13.5, fontWeight: '600', color: ACCENT.hue },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  mealsCount: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: { height: 46, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },
});

import React, { useState } from 'react';
import { RollingTotal } from '../../components/RollingTotal';
import { StepIn } from '../../components/StepIn';
import { categoryName } from '../orders/format';
import { SaleClosedSheet } from '../../components/SaleClosedSheet';
import { useSaleGate } from '../../order/useSaleGate';
import { usePrefill, qtyFrom } from '../../navigation/usePrefill';
import { BAR_BOTTOM_WITH_NAV } from '../../components/BottomNav';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
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
import { ContinueButton } from '../../components/ContinueButton';

const ACCENT = hues.cous;

/** שלישי של קוסקוס · בחירת מנות ואז זרימת המסירה המשותפת */
export function CouscousScreen() {
  const { go, goLogin, loggedIn } = useNav();
  const o = useCouscousOrder();
  const f = useFulfillment({ ...COUSCOUS_FULFILLMENT, meals: o.meals });
  /* ⚠ יום מכירה סגור · מתריעים כאן ולא בשלב התשלום */
  const saleGate = useSaleGate('cous');
  const [gate, setGate] = useState(false);
  /* ⚠ ״להזמין שוב״ · הכמויות של ההזמנה הקודמת כבר מסומנות */
  usePrefill('cous', (d) => {
    const q = qtyFrom(d, o.qty.length);
    if (q) o.setQty(q);
  });
  const [gridW, setGridW] = useState(0);

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (o.total > 0) void saleGate.guard(f.open);
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
        {meals.map(({ it, i }, k) => (
          <StepIn key={it.name} index={k} style={s.row}>
            <Photo name={COUSCOUS_PHOTOS[i]} rgb={ACCENT.rgb} style={s.shot} />
            <View style={s.rowText}>
              <Text style={s.name}>{it.name}</Text>
              <Text style={s.price}>{it.price} ₪</Text>
            </View>
            <Stepper value={o.qty[i]} onChange={(n) => o.bump(i, n - o.qty[i])} />
          </StepIn>
        ))}

        <Text style={s.pickle}>{PICKLE_NOTE}</Text>
        <Text style={s.addonsLabel}>{ADDONS_LABEL}</Text>

        {/* התוספות · שלוש עמודות בלי תמונה, כמו בקנבס */}
        <View style={s.addonGrid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
          {addons.map(({ it, i }, k) => (
            <StepIn key={it.name} index={meals.length + k} style={[s.addon, { width: addonW }]}>
              {/* התמונה יושבת בתוך הכרטיס מעל השם · שקד ביקשה, אין כזו בקנבס */}
              <Photo
                name={COUSCOUS_PHOTOS[i]}
                rgb={ACCENT.rgb}
                style={[s.addonShot, { width: addonShotSize, height: addonShotSize }]}
              />
              <Text style={s.addonName}>{it.name}</Text>
              <Text style={s.addonPrice}>{it.price} ₪</Text>
              <Stepper value={o.qty[i]} onChange={(n) => o.bump(i, n - o.qty[i])} />
            </StepIn>
          ))}
        </View>
      </ScrollView>

      <View style={[s.bar, loggedIn && s.barWithNav]}>
        <View style={s.totalBox}>
          <Text style={s.mealsCount}>{mealsLabel(o.meals)}</Text>
          <Text style={s.totalLabel}>·</Text>
          <Text style={s.totalLabel}>{TOTAL_LABEL}</Text>
          <RollingTotal value={o.total} style={s.total} />
          <Text style={s.currency}>₪</Text>
        </View>
        <ContinueButton onPress={onContinue} accent={ACCENT} disabled={o.total === 0} />
      </View>

      {/* ⚠ יום המכירה עדיין לא נפתח · חלונית הפעמון */}

      <SaleClosedSheet

        open={!!saleGate.closed}

        categoryName={categoryName('cous')}

        accent={ACCENT}

        note={saleGate.note}

        busy={saleGate.busy}

        err={saleGate.err}

        reminded={saleGate.reminded}
        onUnremind={() => void saleGate.unremind()}
        onRemind={() => {
          void saleGate.remind();
          go('main');
        }}

        onClose={() => {
          saleGate.close();
          go('main');
        }}

      />

      {/* ⚠ קונפטי במקום חלונית ״נרשמת״ · בקשה של שקד */}
      {/* ⚠ **החגיגה עברה לשכבה גלובלית · 17 בספטמבר 2026** · ראו
          `Cheer`. המסך חוזר הביתה **מיד**, והקונפטי והפעמון
          ממשיכים לרוץ מעליו — קודם הניווט קטע אותם, ומשם נולדה
          ההשהיה ששקד קראה לה איטית. */}


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
          /* goLogin ולא go · כך ההתחברות מחזירה בדיוק לכאן */
          goLogin();
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
  /* כשהנאב-בר מוצג השורה עולה מעליו · המיקום מהקנבס */
  barWithNav: { marginBottom: BAR_BOTTOM_WITH_NAV },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  mealsCount: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
});

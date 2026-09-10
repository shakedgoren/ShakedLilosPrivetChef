import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  COCOTTES,
  COCOTTE_PRICE,
  SCHNITZEL_FULFILLMENT,
  SCHNITZEL_FORMS,
  SCHNITZEL_MODES,
  SCHNITZEL_TYPES,
} from '../../data/schnitzel';
import { CategoryHeader } from '../../components/CategoryHeader';
import { LoginGate } from '../../components/LoginGate';
import { Photo } from '../../components/Photo';
import { Stepper } from '../../components/Stepper';
import { SCHNITZEL_BOX_PHOTOS, SCHNITZEL_UNIT_PHOTOS } from '../../data/photos';
import {
  FORM_CARD,
  GIFT_NOTE,
  COCOTTE_ROW,
  GIFT_SPACE,
  PICK_TYPE_LABEL,
  SCHNITZEL_DATE,
  SCHNITZEL_INTRO,
  SCHNITZEL_TITLE,
  TYPE_CARD,
} from '../../data/schnitzelCopy';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useSchnitzelOrder } from './useSchnitzelOrder';
import { ToppingsSheet } from './ToppingsSheet';
import { Gift, PlatterFamily, PlatterSingles } from '../../icons';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

const ACCENT = hues.schn;

/** אייקון המתנה · 19 פיקסלים בקנבס */
const GIFT_GLYPH = 19;
/* נוסח שכתב Claude (אין כותרת לגוש בקנבס) · ✅ שקד אישרה ב-11 בספטמבר 2026 · אין לשנות */
const PICK_FORM_LABEL = 'בחירת צורה';
const PICK_BOX_LABEL = 'בחירת מארז';

/** שישי של מטעמים · חלות בודדות או מארז, עם תוספות וקוקוטים */
export function SchnitzelScreen() {
  const { go, loggedIn } = useNav();
  const o = useSchnitzelOrder();
  /* רוחב הכרטיס נמדד · הנוסחה בקנבס היא (100% − רווח) ÷ 2 */
  const [gridW, setGridW] = useState(0);
  const typeCardW = gridW ? (gridW - TYPE_CARD.gridGap) / 2 : undefined;
  const f = useFulfillment(SCHNITZEL_FULFILLMENT);
  const [gate, setGate] = useState(false);

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (o.total > 0) f.open();
  };

  return (
    <View style={s.page}>
      <CategoryHeader title={SCHNITZEL_TITLE} date={SCHNITZEL_DATE} />

      <Text style={s.intro}>{SCHNITZEL_INTRO}</Text>

      <View style={s.modes}>
        {SCHNITZEL_MODES.map((label, k) => (
          <Pressable
            key={label}
            onPress={() => o.setMode(k)}
            style={[s.mode, o.mode === k && s.modeOn]}
          >
            <Text style={[s.modeText, o.mode === k && { color: ACCENT.deep, fontWeight: '600' }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {/* כרטיס המתנה · האייקון היה בקנבס ולא הועבר */}
        <View style={s.gift}>
          <Gift size={GIFT_GLYPH} color={ACCENT.hue} strokeWidth={1.6} />
          <Text style={s.giftText}>{GIFT_NOTE}</Text>
        </View>

        {o.isUnit ? (
          <>
            {o.basket.map((b, i) => (
              <View key={`${b.type}-${i}`} style={s.row}>
                <Photo name={SCHNITZEL_UNIT_PHOTOS[b.type]} rgb={ACCENT.rgb} style={s.shot} />
                <View style={s.rowText}>
                  <Text style={s.name}>
                    חלה {i + 1} · {SCHNITZEL_TYPES[b.type].short}
                  </Text>
                  <Text style={s.tops}>{b.tops.length ? b.tops.join(' · ') : 'בלי תוספות'}</Text>
                </View>
                <Text style={s.price}>{SCHNITZEL_TYPES[b.type].unit} ₪</Text>
                <Pressable onPress={() => o.openEdit(i)} hitSlop={8}>
                  <Text style={s.action}>עריכה</Text>
                </Pressable>
                <Pressable onPress={() => o.removeRoll(i)} hitSlop={8}>
                  <Text style={s.remove}>✕</Text>
                </Pressable>
              </View>
            ))}

            <Text style={s.sectionTitle}>{PICK_TYPE_LABEL}</Text>
            {/* שתי עמודות · תמונה מלמעלה, בדיוק כמו בקנבס */}
            <View style={s.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              {SCHNITZEL_TYPES.map((t, k) => (
                <Pressable
                  key={t.name}
                  onPress={() => o.openAdd(k)}
                  style={[s.typeCard, { width: typeCardW }]}
                >
                  <Photo name={SCHNITZEL_UNIT_PHOTOS[k]} rgb={ACCENT.rgb} style={s.typeShot} zoom={false} />
                  <Text style={s.typeName}>{t.name}</Text>
                  <Text style={s.typePrice}>{t.unit} ₪</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* צורת המארז · SCHNITZEL_FORMS בקנבס · קדם לבחירת המארז */}
            <Text style={s.sectionTitle}>{PICK_FORM_LABEL}</Text>
            <View style={s.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              {SCHNITZEL_FORMS.map((name, k) => {
                const on = o.form === k;
                const Glyph = k === 0 ? PlatterSingles : PlatterFamily;
                return (
                  <Pressable
                    key={name}
                    onPress={() => o.setForm(k)}
                    style={[s.formCard, { width: typeCardW }, on ? s.pickOn : s.pickOff]}
                  >
                    <Glyph size={FORM_CARD.glyph} color={on ? ACCENT.deep : '#8A8194'} strokeWidth={1.6} />
                    <Text style={[s.formName, on && s.pickedText]}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* המארזים שנבחרו · שורה לכל מארז, בדיוק כמו החלות הבודדות */}
            {o.boxes.map((b, i) => (
              <View key={`${b.type}-${i}`} style={s.row}>
                <Photo name={SCHNITZEL_BOX_PHOTOS[b.type]} rgb={ACCENT.rgb} style={s.shot} />
                <View style={s.rowText}>
                  <Text style={s.name}>
                    מארז {i + 1} · {SCHNITZEL_TYPES[b.type].short}
                  </Text>
                  <Text style={s.tops}>{b.tops.length ? b.tops.join(' · ') : 'בלי תוספות'}</Text>
                </View>
                <Text style={s.price}>{SCHNITZEL_TYPES[b.type].box} ₪</Text>
                <Pressable onPress={() => o.openBoxEdit(i)} hitSlop={8}>
                  <Text style={s.action}>עריכה</Text>
                </Pressable>
                <Pressable onPress={() => o.removeBox(i)} hitSlop={8}>
                  <Text style={s.remove}>✕</Text>
                </Pressable>
              </View>
            ))}

            {/* בחירת מארז · אותו כרטיס בדיוק של ״בחר סוג חלה״ */}
            <Text style={s.sectionTitle}>{PICK_BOX_LABEL}</Text>
            <View style={s.grid}>
              {SCHNITZEL_TYPES.map((t, k) => (
                <Pressable
                  key={t.name}
                  onPress={() => o.openBox(k)}
                  style={[s.typeCard, { width: typeCardW }]}
                >
                  <Photo name={SCHNITZEL_BOX_PHOTOS[k]} rgb={ACCENT.rgb} style={s.typeShot} zoom={false} />
                  <Text style={s.typeName}>{t.name}</Text>
                  <Text style={s.typePrice}>{t.box} ₪</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>רטבים בקוקוט · {COCOTTE_PRICE} ₪ ליחידה</Text>
        {COCOTTES.map((name, i) => (
          <View key={name} style={[s.row, s.cocotteRow]}>
            <Text style={[s.name, s.rowText]}>{name}</Text>
            <Stepper value={o.cocottes[i]} onChange={(n) => o.bumpCocotte(i, n - o.cocottes[i])} />
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

      <ToppingsSheet pop={o.pop} onToggle={o.toggleTop} onCancel={o.closePop} onSave={o.commitPop} />

      <FulfillmentFlow
        f={f}
        lines={o.lines}
        total={o.total}
        accent={ACCENT}
        details={{
          category: 'schn',
          mode: o.isUnit ? 'unit' : 'box',
          rolls: o.basket,
          boxes: o.boxes,
          cocottes: o.cocottes,
        }}
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
  intro: {
    fontSize: 13.5,
    fontWeight: '300',
    lineHeight: 22,
    color: surface.inkSoft,
    textAlign: 'center',
    paddingHorizontal: space.lg,
    marginBottom: 12,
  },
  gift: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: a(ACCENT.rgb, 0.08),
    borderWidth: 1,
    borderColor: a(ACCENT.rgb, 0.2),
    marginTop: GIFT_SPACE.before,
    marginBottom: GIFT_SPACE.after,
  },
  giftText: { flex: 1, fontSize: 14.5, fontWeight: '600', lineHeight: 20, color: ACCENT.deep },

  /* שתי עמודות · תמונה מלמעלה · משותפת לחלות, לצורות ולמארזים */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: TYPE_CARD.gridGap },
  formCard: {
    height: FORM_CARD.height,
    borderRadius: FORM_CARD.radius,
    padding: FORM_CARD.padding,
    gap: FORM_CARD.gap,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  formName: { fontSize: 12.5, textAlign: 'center', lineHeight: 15.6, color: '#8A8194' },
  /* הנבחר והלא-נבחר · chip() בקנבס */
  pickOn: { backgroundColor: a(ACCENT.rgb, 0.1), borderColor: a(ACCENT.rgb, 0.42) },
  pickOff: { backgroundColor: 'rgba(255,255,255,0.7)', borderColor: 'rgba(130,112,162,0.16)' },
  pickedText: { color: ACCENT.deep, fontWeight: '600' },
  typeCard: {
    borderRadius: TYPE_CARD.radius,
    paddingVertical: TYPE_CARD.padV,
    paddingHorizontal: TYPE_CARD.padH,
    gap: TYPE_CARD.gap,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.74)',
  },
  typeShot: {
    width: '100%',
    height: TYPE_CARD.shotHeight,
    borderRadius: TYPE_CARD.shotRadius,
    overflow: 'hidden',
  },
  typeName: { fontSize: 13, fontWeight: '600', lineHeight: 16, textAlign: 'center', color: surface.ink },
  typePrice: { fontSize: 13, fontWeight: '600', color: ACCENT.deep },

  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: 88 },
  modes: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: space.sm,
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.09)',
  },
  mode: { paddingVertical: 8, paddingHorizontal: 22, borderRadius: radius.pill },
  modeOn: { backgroundColor: '#FFFFFF' },
  modeText: { fontSize: 14, color: '#8A8194' },

  list: { paddingTop: space.sm, paddingBottom: space.lg, gap: space.sm },
  sectionTitle: {
    fontSize: type.label,
    color: surface.muted,
    textAlign: 'center',
    marginTop: space.sm,
    marginBottom: 2,
  },
  /* שורת הרטב · נמוכה יותר משורת החלה, לבקשת שקד */
  cocotteRow: {
    paddingVertical: COCOTTE_ROW.padV,
    paddingHorizontal: COCOTTE_ROW.padH,
    borderRadius: COCOTTE_ROW.radius,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
  },
  shot: { width: 58, height: 58, borderRadius: radius.field, overflow: 'hidden' },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '500', color: surface.ink },
  tops: { fontSize: 12, color: surface.muted },
  price: { fontSize: type.label, color: surface.muted },
  action: { fontSize: 12.5, fontWeight: '600', color: ACCENT.deep },
  remove: { fontSize: 14, color: '#B95349' },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: { height: 46, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },
});

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  COCOTTES,
  COCOTTE_PRICE,
  SCHNITZEL_FULFILLMENT,
  SCHNITZEL_MODES,
  SCHNITZEL_TYPES,
} from '../../data/schnitzel';
import { CategoryHeader } from '../../components/CategoryHeader';
import { LoginGate } from '../../components/LoginGate';
import { Stepper } from '../../components/Stepper';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useSchnitzelOrder } from './useSchnitzelOrder';
import { ToppingsSheet } from './ToppingsSheet';

const ACCENT = hues.schn;

/** שישי של מטעמים · חלות בודדות או מארז, עם תוספות וקוקוטים */
export function SchnitzelScreen() {
  const { go, loggedIn } = useNav();
  const o = useSchnitzelOrder();
  const f = useFulfillment(SCHNITZEL_FULFILLMENT);
  const [gate, setGate] = useState(false);

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (o.total > 0) f.open();
  };

  return (
    <View style={s.page}>
      <CategoryHeader title="שישי של מטעמים" date="שישי · 28 באוגוסט" />

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
        {o.isUnit ? (
          <>
            {o.basket.map((b, i) => (
              <View key={`${b.type}-${i}`} style={s.row}>
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

            <Text style={s.sectionTitle}>הוספת חלה</Text>
            {SCHNITZEL_TYPES.map((t, k) => (
              <Pressable key={t.name} onPress={() => o.openAdd(k)} style={s.pick}>
                <View style={s.rowText}>
                  <Text style={s.name}>{t.name}</Text>
                  <Text style={s.price}>{t.unit} ₪</Text>
                </View>
                <Text style={s.plus}>+</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <Text style={s.sectionTitle}>בחירת מארז</Text>
            {SCHNITZEL_TYPES.map((t, k) => {
              const on = o.box?.type === k;
              return (
                <Pressable
                  key={t.name}
                  onPress={() => o.openBox(k)}
                  style={[s.pick, on && { borderColor: a(ACCENT.rgb, 0.42), backgroundColor: a(ACCENT.rgb, 0.1) }]}
                >
                  <View style={s.rowText}>
                    <Text style={s.name}>{t.name}</Text>
                    <Text style={s.price}>{t.box} ₪</Text>
                    {on && <Text style={s.tops}>{o.box!.tops.length ? o.box!.tops.join(' · ') : 'בלי תוספות'}</Text>}
                  </View>
                  {on && (
                    <Pressable onPress={o.openBoxEdit} hitSlop={8}>
                      <Text style={s.action}>עריכה</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </>
        )}

        <Text style={s.sectionTitle}>רטבים בקוקוט · {COCOTTE_PRICE} ₪ ליחידה</Text>
        {COCOTTES.map((name, i) => (
          <View key={name} style={s.row}>
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
          box: o.box,
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
  page: { flex: 1, backgroundColor: surface.ground, paddingHorizontal: space.lg, paddingTop: 88 },
  modes: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: space.md,
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.09)',
  },
  mode: { paddingVertical: 8, paddingHorizontal: 22, borderRadius: radius.pill },
  modeOn: { backgroundColor: '#FFFFFF' },
  modeText: { fontSize: 14, color: '#8A8194' },

  list: { paddingVertical: space.lg, gap: space.sm },
  sectionTitle: { fontSize: type.label, color: surface.muted, marginTop: space.md, marginBottom: 2 },
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
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.16)',
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '500', color: surface.ink },
  tops: { fontSize: 12, color: surface.muted },
  price: { fontSize: type.label, color: surface.muted },
  action: { fontSize: 12.5, fontWeight: '600', color: ACCENT.deep },
  remove: { fontSize: 14, color: '#B95349' },
  plus: { fontSize: 20, color: ACCENT.deep, fontWeight: '600' },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: { height: 46, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },
});

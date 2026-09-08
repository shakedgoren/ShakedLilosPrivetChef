import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CITIES, PAYMENTS, SALE_DATE } from '../data/shared';
import { PickupMaps } from '../components/PickupMaps';
import { a, radius, space, surface, type } from '../theme/tokens';
import { STEP, type Fulfillment } from './useFulfillment';
import { hhmm, type Accent, type OrderLine } from './types';

type Props = {
  f: Fulfillment;
  lines: OrderLine[];
  total: number;
  accent: Accent;
  onHome: () => void;
};

/** זרימת המסירה והתשלום · משותפת לכל הקטגוריות */
export function FulfillmentFlow({ f, lines, total, accent, onHome }: Props) {
  if (f.step === STEP.closed) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={f.reset}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <View style={s.head}>
            <Text style={s.title}>{titleFor(f)}</Text>
            <Pressable onPress={f.reset} hitSlop={10}>
              <Text style={s.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={s.body} contentContainerStyle={s.bodyPad}>
            {f.step === STEP.ship && <ShipStep f={f} accent={accent} />}
            {f.step === STEP.time &&
              (f.isDelivery ? <SlotsStep f={f} accent={accent} /> : <ClockStep f={f} accent={accent} />)}
            {f.step === STEP.address && <AddressStep f={f} accent={accent} />}
            {f.step === STEP.pay && <PayStep f={f} />}
            {(f.step === STEP.done || f.step === STEP.confirm) && (
              <ConfirmStep f={f} lines={lines} total={total} accent={accent} onHome={onHome} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const titleFor = (f: Fulfillment) => {
  if (f.step === STEP.ship) return 'איך תרצי לקבל?';
  if (f.step === STEP.time) return f.isDelivery ? 'שעת משלוח' : 'שעת איסוף';
  if (f.step === STEP.address) return 'כתובת למשלוח';
  if (f.step === STEP.pay) return 'אמצעי תשלום';
  return 'ההזמנה התקבלה';
};

const window = (from: number, to: number) => `${hhmm(from)}–${hhmm(to)}`;

function ShipStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  const { pickupFrom, pickupTo, deliverySlots, minMealsForDelivery } = f.cfg;
  const first = deliverySlots[0];
  const last = deliverySlots[deliverySlots.length - 1];

  return (
    <View style={s.stack}>
      <Pressable onPress={f.wantPickup} style={s.option}>
        <Text style={s.optionTitle}>איסוף עצמי</Text>
        <Text style={s.optionSub}>נופר 25, יבנה · {window(pickupFrom, pickupTo)}</Text>
      </Pressable>

      <Pressable onPress={f.wantDelivery} style={s.option}>
        <Text style={s.optionTitle}>משלוח</Text>
        <Text style={s.optionSub}>
          {minMealsForDelivery !== undefined ? `מ־${minMealsForDelivery} מנות · ` : ''}
          {first}–{last}
        </Text>
      </Pressable>

      {f.toast && (
        <Text style={s.toast}>משלוח מתחיל מ־{minMealsForDelivery} מנות</Text>
      )}
    </View>
  );
}

function ClockStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  return (
    <View style={s.stack}>
      <View style={[s.clockBox, { backgroundColor: a(accent.rgb, 0.08), borderColor: a(accent.rgb, 0.24) }]}>
        <TextInput
          value={f.clock}
          onChangeText={f.setClock}
          onBlur={f.settleClock}
          keyboardType="numbers-and-punctuation"
          style={[s.clock, { color: accent.deep }]}
        />
        <Text style={s.hint}>בין {hhmm(f.cfg.pickupFrom)} ל־{hhmm(f.cfg.pickupTo)}</Text>
      </View>
      <Pressable onPress={f.clockNext} style={[s.cta, { backgroundColor: a(accent.rgb, 0.5) }]}>
        <Text style={[s.ctaText, { color: accent.deep }]}>המשך</Text>
      </Pressable>
    </View>
  );
}

function SlotsStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  return (
    <View style={s.slots}>
      {f.cfg.deliverySlots.map((t) => (
        <Pressable
          key={t}
          onPress={() => f.pickSlot(t)}
          style={[s.slot, { backgroundColor: a(accent.rgb, 0.1) }]}
        >
          <Text style={[s.slotText, { color: accent.deep }]}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AddressStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  return (
    <View style={s.stack}>
      <View style={s.cities}>
        {CITIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => f.setCity(c)}
            style={[s.city, f.city === c && { backgroundColor: a(accent.rgb, 0.22) }]}
          >
            <Text style={[s.cityText, f.city === c && { color: accent.deep, fontWeight: '600' }]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={f.addr}
        onChangeText={f.setAddr}
        placeholder="רחוב ומספר בית"
        placeholderTextColor="#B3ABBD"
        style={s.field}
      />

      <Pressable
        onPress={f.addressNext}
        disabled={!f.addressOk}
        style={[s.cta, { backgroundColor: a(accent.rgb, 0.5), opacity: f.addressOk ? 1 : 0.45 }]}
      >
        <Text style={[s.ctaText, { color: accent.deep }]}>המשך</Text>
      </Pressable>
    </View>
  );
}

function PayStep({ f }: { f: Fulfillment }) {
  return (
    <View style={s.stack}>
      {PAYMENTS.map((p) => (
        <Pressable key={p} onPress={() => f.pickPay(p)} style={s.option}>
          <Text style={s.optionTitle}>{p}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ConfirmStep({
  f,
  lines,
  total,
  accent,
  onHome,
}: {
  f: Fulfillment;
  lines: OrderLine[];
  total: number;
  accent: Accent;
  onHome: () => void;
}) {
  return (
    <View style={s.stack}>
      <Text style={s.doneNote}>נשלח לך אישור לוואטסאפ</Text>

      <View style={s.summary}>
        <Text style={s.summaryHead}>סיכום ההזמנה</Text>

        {lines.map((l) => (
          <View key={l.name} style={s.line}>
            <Text style={s.lineQty}>{l.qty}×</Text>
            <Text style={s.lineName}>{l.name}</Text>
            <Text style={s.lineSum}>{l.sum} ₪</Text>
          </View>
        ))}

        <View style={s.rule} />
        <View style={s.line}>
          <Text style={s.totalLabel}>סה״כ</Text>
          <Text style={s.total}>{total}</Text>
          <Text style={s.currency}>₪</Text>
        </View>

        <View style={s.rule} />
        <Row k={f.isDelivery ? 'משלוח' : 'איסוף עצמי'} v={f.time ?? ''} />
        {f.isDelivery && <Row k="כתובת" v={`${f.addr}, ${f.city}`} />}
        <Row k="תשלום" v={f.pay ?? ''} />
        <Row k="מועד" v={SALE_DATE} />

        {!f.isDelivery && <PickupMaps rgb={accent.rgb} ink={accent.deep} />}
      </View>

      <Pressable onPress={onHome} style={[s.cta, { backgroundColor: a(accent.rgb, 0.5) }]}>
        <Text style={[s.ctaText, { color: accent.deep }]}>חזרה לדף הבית</Text>
      </Pressable>
    </View>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <View style={s.line}>
    <Text style={s.rowKey}>{k}</Text>
    <Text style={s.rowVal}>{v}</Text>
  </View>
);

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(42,36,48,0.34)', justifyContent: 'center', padding: space.lg },
  sheet: { maxHeight: '86%', borderRadius: 28, backgroundColor: '#FEFCFB', padding: space.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: surface.ink },
  close: { fontSize: 16, color: surface.faint },
  body: { marginTop: space.md },
  bodyPad: { paddingBottom: space.sm },
  stack: { gap: space.md },

  option: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.16)',
    gap: 3,
  },
  optionTitle: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  optionSub: { fontSize: type.label, color: surface.muted },
  toast: { fontSize: type.label, color: '#B95349', textAlign: 'center' },

  clockBox: { borderRadius: 22, paddingVertical: 20, alignItems: 'center', gap: 6, borderWidth: 1.5 },
  clock: { fontSize: 42, fontWeight: '600', textAlign: 'center', minWidth: 168 },
  hint: { fontSize: 11.5, color: surface.muted },

  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9 },
  slot: { width: '30%', height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 14, fontWeight: '600' },

  cities: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  city: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.09)',
  },
  cityText: { fontSize: 13, color: surface.inkSoft },
  field: {
    height: 48,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    fontSize: 15,
    textAlign: 'right',
    color: surface.ink,
  },

  cta: { height: 50, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },

  doneNote: { fontSize: type.body, color: surface.muted, textAlign: 'center' },
  summary: { borderRadius: 24, padding: space.lg, backgroundColor: 'rgba(255,255,255,0.8)', gap: 8 },
  summaryHead: { fontSize: 10.5, letterSpacing: 2, fontWeight: '600', color: '#A69EAE' },
  line: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  lineQty: { fontSize: type.body, fontWeight: '500', color: surface.inkSoft },
  lineName: { flex: 1, fontSize: type.body, color: surface.inkSoft },
  lineSum: { fontSize: type.body, fontWeight: '600', color: surface.ink },
  rule: { height: 1, backgroundColor: surface.hairline },
  totalLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: surface.ink },
  total: { fontSize: 20, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 13, color: '#7A7080' },
  rowKey: { flex: 1, fontSize: type.label, color: surface.muted },
  rowVal: { fontSize: type.body, fontWeight: '600', color: surface.ink },
});

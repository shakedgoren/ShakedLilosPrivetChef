import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CITIES, DELIVERY_MIN_MEALS, DELIVERY_SLOTS, PAYMENTS } from '../../data/couscous';
import { PickupMaps } from '../../components/PickupMaps';
import { hues, radius, space, surface, type } from '../../theme/tokens';
import { STEP, type useCouscousOrder } from './useCouscousOrder';

const INK = hues.cous.deep;
const RGB = hues.cous.rgb;

type Order = ReturnType<typeof useCouscousOrder>;

/** זרימת ההזמנה · משלוח או איסוף, שעה, כתובת, תשלום ואישור */
export function OrderFlow({ o, onHome }: { o: Order; onHome: () => void }) {
  if (o.step === STEP.closed) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={o.reset}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <View style={s.head}>
            <Text style={s.title}>{titleFor(o)}</Text>
            <Pressable onPress={o.reset} hitSlop={10}>
              <Text style={s.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={s.body} contentContainerStyle={s.bodyPad}>
            {o.step === STEP.ship && <ShipStep o={o} />}
            {o.step === STEP.time && (o.isDelivery ? <SlotsStep o={o} /> : <ClockStep o={o} />)}
            {o.step === STEP.address && <AddressStep o={o} />}
            {o.step === STEP.pay && <PayStep o={o} />}
            {(o.step === STEP.done || o.step === STEP.confirm) && <ConfirmStep o={o} onHome={onHome} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const titleFor = (o: Order) => {
  if (o.step === STEP.ship) return 'איך תרצי לקבל?';
  if (o.step === STEP.time) return o.isDelivery ? 'שעת משלוח' : 'שעת איסוף';
  if (o.step === STEP.address) return 'כתובת למשלוח';
  if (o.step === STEP.pay) return 'אמצעי תשלום';
  return 'ההזמנה התקבלה';
};

function ShipStep({ o }: { o: Order }) {
  return (
    <View style={s.stack}>
      <Pressable onPress={o.wantPickup} style={s.option}>
        <Text style={s.optionTitle}>איסוף עצמי</Text>
        <Text style={s.optionSub}>נופר 25, יבנה · 11:30–14:30</Text>
      </Pressable>

      <Pressable onPress={o.wantDelivery} style={s.option}>
        <Text style={s.optionTitle}>משלוח</Text>
        <Text style={s.optionSub}>מ־{DELIVERY_MIN_MEALS} מנות · 12:00–14:00</Text>
      </Pressable>

      {o.toast && <Text style={s.toast}>משלוח מתחיל מ־{DELIVERY_MIN_MEALS} מנות</Text>}
    </View>
  );
}

function ClockStep({ o }: { o: Order }) {
  return (
    <View style={s.stack}>
      <View style={s.clockBox}>
        <TextInput
          value={o.clock}
          onChangeText={o.setClock}
          onBlur={o.settleClock}
          placeholder="12:00"
          keyboardType="numbers-and-punctuation"
          style={s.clock}
        />
        <Text style={s.hint}>בין 11:30 ל־14:30</Text>
      </View>
      <Pressable onPress={o.clockNext} style={s.cta}>
        <Text style={s.ctaText}>המשך</Text>
      </Pressable>
    </View>
  );
}

function SlotsStep({ o }: { o: Order }) {
  return (
    <View style={s.slots}>
      {DELIVERY_SLOTS.map((t) => (
        <Pressable key={t} onPress={() => o.pickSlot(t)} style={s.slot}>
          <Text style={s.slotText}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AddressStep({ o }: { o: Order }) {
  return (
    <View style={s.stack}>
      <View style={s.cities}>
        {CITIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => o.setCity(c)}
            style={[s.city, o.city === c && s.cityOn]}
          >
            <Text style={[s.cityText, o.city === c && s.cityTextOn]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={o.addr}
        onChangeText={o.setAddr}
        placeholder="רחוב ומספר בית"
        placeholderTextColor="#B3ABBD"
        style={s.field}
      />

      <Pressable
        onPress={o.addressNext}
        disabled={!o.addressOk}
        style={[s.cta, { opacity: o.addressOk ? 1 : 0.45 }]}
      >
        <Text style={s.ctaText}>המשך</Text>
      </Pressable>
    </View>
  );
}

function PayStep({ o }: { o: Order }) {
  return (
    <View style={s.stack}>
      {PAYMENTS.map((p) => (
        <Pressable key={p} onPress={() => o.pickPay(p)} style={s.option}>
          <Text style={s.optionTitle}>{p}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ConfirmStep({ o, onHome }: { o: Order; onHome: () => void }) {
  return (
    <View style={s.stack}>
      <Text style={s.doneNote}>נשלח לך אישור לוואטסאפ</Text>

      <View style={s.summary}>
        <Text style={s.summaryHead}>סיכום ההזמנה</Text>

        {o.lines.map((l) => (
          <View key={l.name} style={s.line}>
            <Text style={s.lineQty}>{l.qty}×</Text>
            <Text style={s.lineName}>{l.name}</Text>
            <Text style={s.lineSum}>{l.sum} ₪</Text>
          </View>
        ))}

        <View style={s.rule} />
        <View style={s.line}>
          <Text style={s.totalLabel}>סה״כ</Text>
          <Text style={s.total}>{o.total}</Text>
          <Text style={s.currency}>₪</Text>
        </View>

        <View style={s.rule} />
        <Row k={o.isDelivery ? 'משלוח' : 'איסוף עצמי'} v={o.time ?? ''} />
        {o.isDelivery && <Row k="כתובת" v={`${o.addr}, ${o.city}`} />}
        <Row k="תשלום" v={o.pay ?? ''} />
        <Row k="מועד" v="שלישי · 25 באוגוסט" />

        {!o.isDelivery && <PickupMaps rgb={RGB} ink={INK} />}
      </View>

      <Pressable onPress={onHome} style={s.cta}>
        <Text style={s.ctaText}>חזרה לדף הבית</Text>
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

  clockBox: {
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(123,92,188,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(123,92,188,0.24)',
  },
  clock: { fontSize: 42, fontWeight: '600', color: INK, textAlign: 'center', minWidth: 168 },
  hint: { fontSize: 11.5, color: surface.muted },

  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9 },
  slot: {
    width: '30%',
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(123,92,188,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: { fontSize: 14, fontWeight: '600', color: INK },

  cities: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  city: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: 'rgba(130,112,162,0.09)' },
  cityOn: { backgroundColor: 'rgba(123,92,188,0.22)' },
  cityText: { fontSize: 13, color: surface.inkSoft },
  cityTextOn: { color: INK, fontWeight: '600' },
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

  cta: { height: 50, borderRadius: radius.pill, backgroundColor: '#BCA7E6', alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600', color: INK },

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

import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DateCalendar } from '../../components/DateCalendar';
import { ContinueButton } from '../../components/ContinueButton';
import { Bag, Close, Truck } from '../../icons';
import { FRUIT_CAL_HINT, fruitDateOpen } from '../../data/calendar';
import { FRUIT_FULFILLMENT, FRUIT_SHIPPING } from '../../data/fruit';
import { hhmm, toMinutes } from '../../order/types';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { TILE_SHADOW } from '../../theme/glass';

/**
 * חלונית פרטי הזמנת מגש פירות.
 *
 * ⚠ **אינה מהקנבס** · בקנבס הלחיצה פותחת את זרימת המסירה הרגילה
 * (איך מגיע אליכם · שעה · כתובת · תשלום). מגשי הפירות לא עוברים
 * במערכת ההזמנות אלא נשלחים לוואטסאפ של מיכל, ושקד ביקשה חלונית
 * אחת שאוספת שם, תאריך, שעה ואופן מסירה — ורק אז שולחת.
 *
 * דמי המשלוח **אינם מומצאים** · הם מחולצים מ-`Fruit.dc.html`.
 */

const ACCENT = hues.fruit;

/* מסגרת החלונית · מידות הפופאפים ב-Fruit.dc.html */
const SHEET_RADIUS = 28;
const SHEET_PAD = 18;
const SHEET_SHADOW = '0 26px 60px -22px rgba(60,48,84,0.72)';
const CLOSE = 32;
const CLOSE_GLYPH = 13;

/* שורות המסירה · אותן מידות כמו בקנבס · גובה 66, פינה 20 */
const OPTION_ICON = 21;
const OPTION_STROKE = 1.7;
const TRUCK_INK = '#8A8194';

const FIELD_H = 48;

type Ship = 'self' | 'deliv';

export type FruitDetails = {
  name: string;
  date: string;
  time: string;
  ship: Ship;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSend: (d: FruitDetails) => void;
};

const window_ = `${hhmm(FRUIT_FULFILLMENT.pickupFrom)}–${hhmm(FRUIT_FULFILLMENT.pickupTo)}`;

export function FruitOrderSheet({ open, onClose, onSend }: Props) {
  const [name, setName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState(hhmm(FRUIT_FULFILLMENT.pickupFrom));
  const [ship, setShip] = React.useState<Ship | null>(null);

  /* שעה מחוץ לטווח נתפסת פנימה · ההצמדה ביציאה מהשדה, לא תוך כדי הקלדה */
  const settleTime = () => {
    const m = toMinutes(time);
    if (m === null) {
      setTime(hhmm(FRUIT_FULFILLMENT.pickupFrom));
      return;
    }
    setTime(hhmm(Math.min(FRUIT_FULFILLMENT.pickupTo, Math.max(FRUIT_FULFILLMENT.pickupFrom, m))));
  };

  const ready = name.trim() !== '' && date !== '' && toMinutes(time) !== null && ship !== null;

  const send = () => {
    if (!ready || !ship) return;
    onSend({ name: name.trim(), date, time, ship });
  };

  if (!open) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <View style={s.head}>
            <Text style={s.title}>פרטי ההזמנה</Text>
            <Pressable onPress={onClose} style={s.close} hitSlop={8}>
              <Close size={CLOSE_GLYPH} color="#6E6478" strokeWidth={2.6} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            <View style={s.field}>
              <Text style={s.label}>שם מלא</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="שם ושם משפחה"
                placeholderTextColor="#B3ABBD"
                style={s.input}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>תאריך</Text>
              <DateCalendar
                value={date || undefined}
                onPick={setDate}
                isOpen={fruitDateOpen}
                hint={FRUIT_CAL_HINT}
                accent={ACCENT}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>שעה</Text>
              <View style={s.clockBox}>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  onBlur={settleTime}
                  keyboardType="numbers-and-punctuation"
                  style={s.clock}
                />
                <Text style={s.hint}>בין {hhmm(FRUIT_FULFILLMENT.pickupFrom)} ל-{hhmm(FRUIT_FULFILLMENT.pickupTo)}</Text>
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>איך מגיע אליכם?</Text>

              <Pressable
                onPress={() => setShip('self')}
                style={[s.option, ship === 'self' ? s.optionOn : s.optionOff]}
              >
                <Bag size={OPTION_ICON} color={ACCENT.hue} strokeWidth={OPTION_STROKE} />
                <View style={s.optionText}>
                  <Text style={s.optionTitle}>איסוף עצמי</Text>
                  <Text style={s.optionSub}>{window_}</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setShip('deliv')}
                style={[s.option, ship === 'deliv' ? s.optionOn : s.optionOff]}
              >
                <Truck
                  size={OPTION_ICON}
                  color={ship === 'deliv' ? ACCENT.hue : TRUCK_INK}
                  strokeWidth={OPTION_STROKE}
                />
                <View style={s.optionText}>
                  <Text style={s.optionTitle}>משלוח</Text>
                  <Text style={s.optionSub}>{window_}</Text>
                </View>
              </Pressable>

              {/* דמי המשלוח · הועתקו אחד לאחד משלב הכתובת בקנבס */}
              <View style={s.fees}>
                <Fee label={FRUIT_SHIPPING.near.label} fee={FRUIT_SHIPPING.near.fee} />
                <View style={s.feeRule} />
                <Fee label={FRUIT_SHIPPING.far.label} fee={FRUIT_SHIPPING.far.fee} />
                <View style={s.feeRule} />
                <Text style={s.feeArea}>{FRUIT_SHIPPING.area}</Text>
              </View>
            </View>

            <ContinueButton
              onPress={send}
              accent={ACCENT}
              disabled={!ready}
              label="שליחה בוואטסאפ"
              style={s.send}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const Fee = ({ label, fee }: { label: string; fee: number }) => (
  <View style={s.feeRow}>
    <Text style={s.feeLabel}>{label}</Text>
    <Text style={s.feeValue}>{fee} ₪</Text>
  </View>
);

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(42,36,48,0.34)', justifyContent: 'center', padding: space.lg },
  sheet: {
    maxHeight: '88%',
    borderRadius: SHEET_RADIUS,
    padding: SHEET_PAD,
    backgroundColor: '#FEFCFB',
    boxShadow: SHEET_SHADOW,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: surface.ink },
  close: {
    width: CLOSE,
    height: CLOSE,
    borderRadius: CLOSE / 2,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { paddingTop: 16, paddingBottom: space.sm, gap: 16 },
  field: { gap: 7 },
  label: { fontSize: 11.5, fontWeight: '500', color: '#8A8194', paddingHorizontal: 4 },
  input: {
    height: FIELD_H,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 15,
    textAlign: 'right',
    color: surface.ink,
  },

  /* קופסת השעה · אותן מידות כמו `isClock` בקנבס */
  clockBox: {
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    backgroundColor: a(ACCENT.rgb, 0.08),
    borderColor: a(ACCENT.rgb, 0.24),
  },
  clock: { fontSize: 42, fontWeight: '600', textAlign: 'center', minWidth: 168, color: ACCENT.deep },
  hint: { fontSize: 11.5, fontWeight: '300', color: surface.muted },

  option: {
    height: 66,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  optionOn: { backgroundColor: a(ACCENT.rgb, 0.08), borderColor: a(ACCENT.rgb, 0.3) },
  optionOff: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(130,112,162,0.16)',
    boxShadow: TILE_SHADOW,
  },
  optionText: { flexGrow: 1, flexShrink: 1, gap: 2 },
  optionTitle: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  optionSub: { fontSize: 12, fontWeight: '300', color: surface.muted },

  /* לוח דמי המשלוח · פינה 18, ריפוד 13/15, כמו בקנבס */
  fees: {
    marginTop: 2,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: a(ACCENT.rgb, 0.07),
    borderWidth: 1,
    borderColor: a(ACCENT.rgb, 0.18),
    gap: 7,
  },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feeLabel: { flexGrow: 1, fontSize: 12.5, fontWeight: '400', color: '#6E6478' },
  feeValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: ACCENT.hue,
    fontVariant: ['tabular-nums'],
  },
  feeRule: { height: 1, backgroundColor: a(ACCENT.rgb, 0.16) },
  feeArea: { fontSize: 11.5, fontWeight: '300', color: '#8A8194', lineHeight: 17.25 },

  send: { alignSelf: 'center', marginTop: 4 },
});

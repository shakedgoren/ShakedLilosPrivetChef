import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import { BOOK, DELIV_MIN_MEALS, HUES, MANUAL_CATS, SHIP_FEE } from '../data/adminOrders';
import { Sheet } from './ui/Sheet';
import { Field, FieldLabel } from './ui/Field';
import { Chip } from './ui/Chip';
import { MenuCounters, RollPicker } from './NewOrderItems';
import { belowMin, isReady, itemsSum, okPhone, shipFee, total, trim } from './orderMath';
import type { useAdminOrders } from './useAdminOrders';

const COUS = HUES.cous;
const SHIPS = [
  { id: 'pickup', n: 'איסוף' },
  { id: 'deliv', n: 'משלוח' },
] as const;

/** הערת ההתאמה מתחת לשדה הטלפון · מספרת אם הלקוחה כבר במערכת */
function phoneNote(phone: string, known: boolean) {
  if (trim(phone) === '')
    return { text: 'אפשר לבחור שם מהרשימה והטלפון יתמלא לבד', fg: '#A79FB2' };
  if (!okPhone(phone)) return { text: 'מספר טלפון לא תקין', fg: '#B95349' };
  if (known) return { text: 'לקוחה קיימת', fg: '#4E8A64' };
  return { text: 'לקוחה חדשה · תיווצר לה כרטיסייה עם שמירת ההזמנה', fg: COUS.hue };
}

type Props = { admin: ReturnType<typeof useAdminOrders> };

export function NewOrderSheet({ admin }: Props) {
  const d = admin.draft;
  const ready = isReady(d);
  const note = phoneNote(d.phone, admin.isKnown);

  /* השלמה מהפנקס · נסגרת ברגע שנבחר שם מדויק */
  const q = trim(d.name);
  const book = admin.book ?? BOOK;
  const exact = book.some((b) => b.name === q);
  const people = q === '' || exact ? [] : book.filter((b) => b.name.includes(q)).slice(0, 4);

  return (
    <Sheet title="הזמנה ידנית" sub="מוואטסאפ או בטלפון" onClose={admin.closeNew} style={s.pos}>
      <ScrollView style={s.body} contentContainerStyle={s.bodyPad} keyboardShouldPersistTaps="handled">
        <Field
          label="שם מלא"
          value={d.name}
          onChange={(v) => admin.setField('name', v)}
          placeholder="התחילי להקליד שם"
        >
          {people.length > 0 ? (
            <View style={s.book}>
              {people.map((b) => (
                <Pressable key={b.phone} onPress={() => admin.pickPerson(b)} style={s.bookRow}>
                  <Text style={s.bookName}>{b.name}</Text>
                  <Text style={s.bookPhone}>{b.phone}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Field>

        <Field
          label="טלפון"
          value={d.phone}
          onChange={(v) => admin.setField('phone', v)}
          placeholder="050-0000000"
          keyboardType="phone-pad"
          borderColor={
            trim(d.phone) !== '' && !okPhone(d.phone)
              ? 'rgba(185,83,73,0.5)'
              : 'rgba(130,112,162,0.18)'
          }
          note={note.text}
          noteColor={note.fg}
        />

        <View style={s.block}>
          <FieldLabel text="קטגוריה" />
          <View style={s.row}>
            {MANUAL_CATS.map((k) => (
              <Chip
                key={k}
                label={HUES[k].n}
                on={d.cat === k}
                tint={HUES[k]}
                style={s.flex}
                onPress={() => admin.setCat(k)}
              />
            ))}
          </View>
        </View>

        {d.cat === 'schn' ? (
          <RollPicker
            draft={d}
            onAdd={admin.openRoll}
            onEdit={admin.editRoll}
            onDrop={admin.dropRoll}
          />
        ) : null}

        <MenuCounters draft={d} onBump={admin.bumpItem} />

        <View style={s.block}>
          <FieldLabel text="איך מגיע" />
          <View style={s.row}>
            {SHIPS.map((x) => (
              <Chip
                key={x.id}
                label={x.n}
                on={d.ship === x.id}
                tint={COUS}
                style={s.flex}
                onPress={() => admin.setField('ship', x.id)}
              />
            ))}
          </View>
        </View>

        {d.ship === 'deliv' ? (
          <>
            <View style={s.block}>
              <FieldLabel text="אזור" />
              <View style={s.row}>
                {Object.keys(SHIP_FEE).map((k) => (
                  <Chip
                    key={k}
                    label={`${k === 'יבנה' ? 'יבנה' : 'השפלה'} · ${SHIP_FEE[k]} ₪`}
                    on={d.area === k}
                    tint={COUS}
                    fontSize={12}
                    style={s.flex}
                    onPress={() => admin.setField('area', k)}
                  />
                ))}
              </View>
            </View>
            <Field
              label="כתובת למשלוח"
              value={d.addr}
              onChange={(v) => admin.setField('addr', v)}
              placeholder="רחוב, מספר ועיר"
            />
          </>
        ) : null}

        {belowMin(d) ? (
          <View style={s.warn}>
            <Text style={s.warnText}>{`משלוח קוסקוס מתחיל מ-${DELIV_MIN_MEALS} מנות`}</Text>
          </View>
        ) : null}

        <Field
          label="שעת איסוף"
          value={d.time}
          onChange={(v) => admin.setField('time', v)}
          placeholder="12:30"
        />

        <View style={s.sum}>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>הפריטים</Text>
            <Text style={s.sumValue}>{`${itemsSum(d)} ₪`}</Text>
          </View>
          {shipFee(d) > 0 ? (
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>משלוח</Text>
              <Text style={s.sumValue}>{`${shipFee(d)} ₪`}</Text>
            </View>
          ) : null}
          <View style={s.rule} />
          <View style={s.sumRow}>
            <Text style={s.totalLabel}>סה״כ</Text>
            <Text style={s.totalValue}>{`${total(d)} ₪`}</Text>
          </View>
        </View>

        <Text style={s.notify}>
          {admin.isKnown
            ? 'עם השמירה תישלח ללקוחה הודעת וואטסאפ עם פרטי ההזמנה.'
            : 'עם השמירה ייפתח ללקוחה כרטיס במערכת ותישלח לה הודעת וואטסאפ.'}
        </Text>
      </ScrollView>

      <Pressable
        onPress={admin.saveNew}
        style={[s.cta, { backgroundColor: ready ? '#C6B3EC' : 'rgba(130,112,162,0.11)' }]}
      >
        <Text style={[s.ctaText, { color: ready ? '#43307A' : '#A79FB2' }]}>שמירת ההזמנה</Text>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  pos: { top: 58, bottom: 34 },
  body: { flex: 1, marginTop: 12 },
  bodyPad: { gap: 12, paddingBottom: 4 },
  block: { gap: 5 },
  row: { flexDirection: 'row', gap: 6 },
  flex: { flex: 1 },
  book: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130,112,162,0.1)',
  },
  bookName: { flex: 1, fontSize: 13, fontWeight: '500', color: surface.ink },
  bookPhone: { fontSize: 11.5, color: '#A79FB2' },
  warn: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(199,125,62,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(199,125,62,0.28)',
  },
  warnText: { fontSize: 12, fontWeight: '600', color: '#A65E2A' },
  sum: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
    backgroundColor: `rgba(${COUS.rgb},0.07)`,
  },
  sumRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sumLabel: { fontSize: 12.5, color: surface.inkSoft },
  sumValue: { fontSize: 13, fontWeight: '600', color: surface.ink },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.16)' },
  totalLabel: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  totalValue: { fontSize: 18, fontWeight: '700', color: COUS.deep },
  notify: { fontSize: 11.5, fontWeight: '300', lineHeight: 17, color: surface.muted, textAlign: 'center' },
  cta: {
    alignSelf: 'center',
    height: 48,
    paddingHorizontal: 30,
    borderRadius: 999,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 15, fontWeight: '600' },
});

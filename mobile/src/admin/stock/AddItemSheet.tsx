import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ADD, SUP_GROUPS, SUP_UNITS } from '../../data/adminStock';
import { Sheet } from '../ui/Sheet';
import { Field, FieldLabel } from '../ui/Field';
import { Chip } from '../ui/Chip';
import { isPacked, type useAdminStock } from './useAdminStock';

const PLUM = { rgb: '123,92,188', deep: '#43307A' };

type Props = { admin: ReturnType<typeof useAdminStock> };

/** הוספת פריט למלאי הלוגיסטי · למשל אחרי שינוי מתכון */
export function AddItemSheet({ admin }: Props) {
  const d = admin.draft;
  const packed = isPacked(d.unit);

  return (
    <Sheet title={ADD.title} sub={ADD.sub} onClose={admin.closeAdd} style={s.pos}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Field
          label={ADD.nameLabel}
          value={d.name}
          onChange={(v) => admin.setField('name', v)}
          placeholder={ADD.namePlaceholder}
        />

        <View style={s.block}>
          <FieldLabel text={ADD.groupLabel} />
          <View style={s.row}>
            {SUP_GROUPS.map((g) => (
              <Chip
                key={g}
                label={g}
                on={d.g === g}
                tint={PLUM}
                style={s.flex}
                onPress={() => admin.setField('g', g)}
              />
            ))}
          </View>
        </View>

        <View style={s.block}>
          <FieldLabel text={ADD.unitLabel} />
          <View style={s.row}>
            {SUP_UNITS.map((u) => (
              <Chip
                key={u}
                label={u}
                on={d.unit === u}
                tint={PLUM}
                fontSize={12}
                style={s.flex}
                onPress={() => admin.setField('unit', u)}
              />
            ))}
          </View>
        </View>

        {packed ? (
          <Field
            label={`כמה יח׳ ב${d.unit}`}
            value={d.per}
            onChange={(v) => admin.setField('per', v)}
            placeholder="0"
            keyboardType="numeric"
          />
        ) : null}

        <View style={s.row}>
          <View style={s.flex}>
            <Field
              label={ADD.qtyLabel}
              value={d.qty}
              onChange={(v) => admin.setField('qty', v)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          <View style={s.flex}>
            <Field
              label={ADD.minLabel}
              value={d.min}
              onChange={(v) => admin.setField('min', v)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={admin.saveAdd}
        style={[s.cta, { backgroundColor: admin.addReady ? '#C6B3EC' : 'rgba(130,112,162,0.11)' }]}
      >
        <Text style={[s.ctaText, { color: admin.addReady ? '#43307A' : '#A79FB2' }]}>
          {ADD.cta}
        </Text>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  pos: { top: 110, maxHeight: 600 },
  body: { gap: 12, marginTop: 12, paddingBottom: 4 },
  block: { gap: 5 },
  row: { flexDirection: 'row', gap: 6 },
  flex: { flex: 1 },
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

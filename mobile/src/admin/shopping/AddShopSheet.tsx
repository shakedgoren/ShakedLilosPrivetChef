import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import { ADD, GROUPS, UNITS } from '../../data/adminShopping';
import { Sheet } from '../ui/Sheet';
import { Field, FieldLabel } from '../ui/Field';
import { Chip } from '../ui/Chip';
import { nf, type useAdminShopping } from './useAdminShopping';

const PLUM = { rgb: '123,92,188', deep: '#43307A' };

type Props = { admin: ReturnType<typeof useAdminShopping> };

export function AddShopSheet({ admin }: Props) {
  const d = admin.draft;

  return (
    <Sheet title={ADD.title} onClose={admin.closeAdd} style={s.pos}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Field
          label={ADD.nameLabel}
          value={d.name}
          onChange={(v) => admin.setField('name', v)}
          placeholder={ADD.namePlaceholder}
        >
          {admin.hits.length > 0 ? (
            <View style={s.pantry}>
              {admin.hits.map((h) => (
                <Pressable key={h.name} onPress={() => admin.pickPantry(h)} style={s.hit}>
                  <Text style={s.hitName}>{h.name}</Text>
                  <Text style={s.hitSub}>{`${h.g} · ${h.price} ₪ ל${h.unit}`}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Field>

        <View style={s.block}>
          <FieldLabel text={ADD.groupLabel} />
          <View style={s.chips}>
            {GROUPS.map((g) => (
              <Chip
                key={g}
                label={g}
                on={d.g === g}
                tint={PLUM}
                fontSize={12}
                onPress={() => admin.setField('g', g)}
              />
            ))}
          </View>
        </View>

        <View style={s.block}>
          <FieldLabel text={ADD.unitLabel} />
          <View style={s.row}>
            {UNITS.map((u) => (
              <Chip
                key={u}
                label={u}
                on={d.unit === u}
                tint={PLUM}
                style={s.flex}
                onPress={() => admin.setField('unit', u)}
              />
            ))}
          </View>
        </View>

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
              label={`מחיר ל${d.unit} ₪`}
              value={d.price}
              onChange={(v) => admin.setField('price', v)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>{ADD.totalLabel}</Text>
          <Text style={s.totalValue}>{`${nf(admin.lineTotal)} ₪`}</Text>
        </View>
      </ScrollView>

      <Pressable
        onPress={admin.saveAdd}
        style={[s.cta, { backgroundColor: admin.addReady ? '#C6B3EC' : 'rgba(130,112,162,0.11)' }]}
      >
        <Text style={[s.ctaText, { color: admin.addReady ? '#43307A' : '#A79FB2' }]}>{ADD.cta}</Text>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  pos: { top: 90, maxHeight: 640 },
  body: { gap: 12, marginTop: 12, paddingBottom: 4 },
  block: { gap: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  flex: { flex: 1 },
  pantry: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
  },
  hit: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130,112,162,0.1)',
  },
  hitName: { fontSize: 13, fontWeight: '500', color: surface.ink },
  hitSub: { fontSize: 11, fontWeight: '300', color: '#A79FB2', marginTop: 1 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, fontWeight: '500', color: surface.inkSoft },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#43307A' },
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

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import { HUES, MENU, ROLL, SCH_ROLLS } from '../data/adminOrders';
import { FieldLabel } from './ui/Field';
import type { NewOrderDraft } from './orderMath';

const SCHN = HUES.schn;

type ItemsProps = {
  draft: NewOrderDraft;
  onBump: (id: string, delta: number) => void;
};

/** מוני הפריטים · בדיוק כמו שהלקוחה בוחרת במסך שלה */
export function MenuCounters({ draft, onBump }: ItemsProps) {
  const hue = HUES[draft.cat];
  return (
    <View style={s.block}>
      <FieldLabel text="מה הוזמן" />
      {(MENU[draft.cat] ?? []).map((it) => {
        const n = draft.qty[it.id] ?? 0;
        return (
          <View key={it.id} style={s.itemRow}>
            <View style={s.itemText}>
              <Text style={s.itemName}>{it.n}</Text>
              <Text style={s.itemPrice}>{`${it.price} ₪`}</Text>
            </View>
            <View style={s.stepper}>
              <Pressable
                onPress={() => onBump(it.id, 1)}
                style={[s.round, { backgroundColor: `rgba(${hue.rgb},0.13)` }]}
              >
                <Text style={[s.sign, { color: hue.deep }]}>+</Text>
              </Pressable>
              <Text
                style={[
                  s.count,
                  { color: n > 0 ? hue.deep : '#C4BDCE', fontWeight: n > 0 ? '700' : '400' },
                ]}
              >
                {n}
              </Text>
              <Pressable
                onPress={() => onBump(it.id, -1)}
                style={[s.round, s.minus, { opacity: n > 0 ? 1 : 0.35 }]}
              >
                <Text style={s.sign}>−</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

type RollsProps = {
  draft: NewOrderDraft;
  onAdd: (type: string) => void;
  onEdit: (i: number) => void;
  onDrop: (i: number) => void;
};

/** החלות · כל אחת נפתחת בחלונית עם התוספות שלה */
export function RollPicker({ draft, onAdd, onEdit, onDrop }: RollsProps) {
  return (
    <View style={s.rollBlock}>
      <FieldLabel text="החלות" />
      {draft.rolls.map((r, i) => (
        <View key={`${r.type}-${i}`} style={s.rollRow}>
          <Pressable onPress={() => onEdit(i)} style={s.rollText}>
            <Text style={s.rollName}>{ROLL[r.type].n}</Text>
            <Text style={s.rollTops}>{r.tops.length ? r.tops.join(' · ') : 'בלי תוספות'}</Text>
          </Pressable>
          <Text style={s.rollPrice}>{`${ROLL[r.type].price} ₪`}</Text>
          <Pressable onPress={() => onDrop(i)} hitSlop={8}>
            <Text style={s.rollDrop}>✕</Text>
          </Pressable>
        </View>
      ))}
      <View style={s.addRow}>
        {SCH_ROLLS.map((r) => (
          <Pressable key={r.type} onPress={() => onAdd(r.type)} style={s.add}>
            <Text style={s.addName}>{`+ ${r.n}`}</Text>
            <Text style={s.addPrice}>{`${r.price} ₪`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  block: { gap: 7 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '500', color: surface.ink },
  itemPrice: { fontSize: 11, fontWeight: '300', color: '#A79FB2' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  round: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: 'rgba(130,112,162,0.09)' },
  sign: { fontSize: 17, fontWeight: '700', color: '#6E6478', lineHeight: 20 },
  count: { minWidth: 20, textAlign: 'center', fontSize: 15.5 },

  rollBlock: { gap: 7 },
  rollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: `rgba(${SCHN.rgb},0.07)`,
    borderWidth: 1.5,
    borderColor: `rgba(${SCHN.rgb},0.2)`,
  },
  rollText: { flex: 1 },
  rollName: { fontSize: 12.5, fontWeight: '600', color: SCHN.deep },
  rollTops: { fontSize: 11, fontWeight: '300', color: surface.muted, marginTop: 1 },
  rollPrice: { fontSize: 12.5, fontWeight: '600', color: SCHN.deep },
  rollDrop: { fontSize: 12, color: '#A79FB2' },
  addRow: { flexDirection: 'row', gap: 6 },
  add: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: `rgba(${SCHN.rgb},0.08)`,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: `rgba(${SCHN.rgb},0.4)`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addName: { fontSize: 12, fontWeight: '600', color: SCHN.deep },
  addPrice: { fontSize: 10.5, color: surface.muted },
});

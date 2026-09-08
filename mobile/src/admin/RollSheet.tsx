import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ROLL } from '../data/adminOrders';
import { Sheet } from './ui/Sheet';
import { Chip } from './ui/Chip';
import type { RollPop } from './useAdminOrders';

const SCHN = { rgb: '65,109,158', deep: '#2B4A6E' };

type Props = {
  pop: NonNullable<RollPop>;
  onToggleTop: (name: string) => void;
  onClose: () => void;
  onSave: () => void;
};

/** חלונית החלה · כל חלה נשמרת עם התוספות שלה, כי כל אחד רוצה משהו אחר */
export function RollSheet({ pop, onToggleTop, onClose, onSave }: Props) {
  const roll = ROLL[pop.type];
  if (!roll) return null;

  return (
    <Sheet title={roll.n} sub="מה נכנס לחלה הזאת" onClose={onClose} style={s.pos}>
      <View style={s.wrap}>
        {roll.tops.map((name) => (
          <Chip
            key={name}
            label={name}
            on={pop.tops.includes(name)}
            tint={SCHN}
            onPress={() => onToggleTop(name)}
          />
        ))}
      </View>
      <Pressable onPress={onSave} style={s.cta}>
        <Text style={s.ctaText}>{pop.edit >= 0 ? 'עדכון החלה' : 'הוספת החלה'}</Text>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  pos: { top: 190, right: 22, left: 22, borderRadius: 26 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  cta: {
    alignSelf: 'center',
    height: 46,
    paddingHorizontal: 28,
    borderRadius: 999,
    marginTop: 13,
    backgroundColor: '#C6B3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 14.5, fontWeight: '600', color: '#43307A' },
});

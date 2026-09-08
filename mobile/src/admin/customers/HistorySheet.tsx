import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import {
  HISTORY,
  HIST_SUB_SUFFIX,
  HIST_TITLE_PREFIX,
  HUES,
  STATE_TONE,
} from '../../data/adminCustomers';
import { Sheet } from '../ui/Sheet';
import { nf } from '../shopping/useAdminShopping';

type Props = { name: string; onClose: () => void };

/** ההזמנות הקודמות של הלקוחה · לקריאה בלבד */
export function HistorySheet({ name, onClose }: Props) {
  const rows = HISTORY[name] ?? [];

  return (
    <Sheet
      title={`${HIST_TITLE_PREFIX}${name}`}
      sub={`${rows.length}${HIST_SUB_SUFFIX}`}
      onClose={onClose}
      style={s.pos}
    >
      <ScrollView contentContainerStyle={s.body}>
        {rows.map((o) => {
          const hue = HUES[o.k];
          const tone = STATE_TONE[o.s] ?? STATE_TONE['נמסרה'];
          return (
            <View key={`${o.d}-${o.t}`} style={s.row}>
              <View style={s.rowHead}>
                <Text style={[s.cat, { color: hue.deep }]}>{hue.n}</Text>
                <Text style={s.date}>{o.d}</Text>
                <View style={s.spacer} />
                <View style={[s.chip, { backgroundColor: tone.bg }]}>
                  <Text style={[s.chipText, { color: tone.fg }]}>{o.s}</Text>
                </View>
              </View>
              <View style={s.rowBody}>
                <Text style={s.text}>{o.t}</Text>
                <Text style={s.value}>{`${nf(o.v)} ₪`}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const s = StyleSheet.create({
  pos: { top: 120, maxHeight: 560 },
  body: { gap: 10, marginTop: 12, paddingBottom: 4 },
  row: {
    gap: 4,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(130,112,162,0.05)',
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cat: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 11.5, fontWeight: '300', color: '#A79FB2' },
  spacer: { flex: 1 },
  chip: { borderRadius: 7, paddingVertical: 2, paddingHorizontal: 8 },
  chipText: { fontSize: 10.5, fontWeight: '700' },
  rowBody: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  text: { flex: 1, fontSize: 12.5, color: surface.inkSoft, lineHeight: 19 },
  value: { fontSize: 14, fontWeight: '700', color: '#43307A' },
});

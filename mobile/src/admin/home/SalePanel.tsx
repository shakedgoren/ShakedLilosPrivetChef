import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import { STATE, type Quota } from '../../data/adminHome';
import { QuotaRings } from './Charts';
import { GlassCard } from './GlassCard';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  quotas: Quota[];
  onBump: (key: string, delta: number) => void;
  step: number;
  ringPct: string;
  note: string;
  dayLabel?: string;
};

/** לוח יום המכירה · מתג פתוח/סגור, טבעות המכסה ומוני המכסה */
export function SalePanel({ isOpen, onToggle, quotas, onBump, step, ringPct, note, dayLabel }: Props) {
  return (
    <GlassCard style={s.card}>
      <View style={s.head}>
        <Text style={s.day}>{`יום מכירה · ${dayLabel || STATE.day}`}</Text>
        <Pressable onPress={onToggle} style={s.toggle} hitSlop={8}>
          <Text style={[s.state, { color: isOpen ? '#437C59' : surface.faint }]}>
            {isOpen ? 'פתוח' : 'סגור'}
          </Text>
          <View
            style={[s.track, { backgroundColor: isOpen ? '#437C59' : 'rgba(130,112,162,0.28)' }]}
          >
            <View style={[s.knob, isOpen ? s.knobOn : s.knobOff]} />
          </View>
        </Pressable>
      </View>

      <View style={s.body}>
        <QuotaRings quotas={quotas} pct={ringPct} />
        <View style={s.rows}>
          {quotas.map((q) => (
            <View key={q.key} style={s.row}>
              <View style={[s.dot, { backgroundColor: q.hue }]} />
              <Text style={s.name}>{q.name}</Text>
              <Text style={s.sold}>{`${q.sold}/`}</Text>
              <View style={[s.pill, { backgroundColor: `rgba(${q.rgb},0.1)` }]}>
                <Pressable onPress={() => onBump(q.key, -step)} style={s.step} hitSlop={6}>
                  <Text style={s.stepGlyph}>−</Text>
                </Pressable>
                <Text style={s.quota}>{q.quota}</Text>
                <Pressable onPress={() => onBump(q.key, step)} style={s.step} hitSlop={6}>
                  <Text style={s.stepGlyph}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={s.note}>{note}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { height: 144, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  day: { flex: 1, fontSize: 13, fontWeight: '600', color: surface.ink },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  state: { fontSize: 11.5, fontWeight: '600' },
  track: { width: 40, height: 23, borderRadius: 999, justifyContent: 'center' },
  knob: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  /* בקנבס הידית נעה מהקצה ההתחלתי · ב-RTL זהו הצד הימני */
  knobOn: { start: 2.5 },
  knobOff: { start: 19.5 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, flex: 1 },
  rows: { flex: 1, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  name: { flex: 1, fontSize: 11.5, color: surface.inkSoft },
  sold: { fontSize: 11.5, fontWeight: '600', color: '#6E6478' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 4,
    borderRadius: 999,
  },
  step: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: { fontSize: 12, fontWeight: '700', color: '#6E6478', lineHeight: 14 },
  quota: { minWidth: 22, textAlign: 'center', fontSize: 12.5, fontWeight: '600', color: surface.ink },
  note: { fontSize: 10.5, fontWeight: '300', color: surface.faint },
});

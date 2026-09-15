import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { surface } from '../../theme/tokens';
import { GlassCard } from './GlassCard';
import type { DishRow } from './useAdminHome';

/**
 * לוח יום המכירה · מתג פתוח/סגור, טבעת האחוזים ושורה לכל מנה.
 *
 * ⚠ **שורה לכל מנה** · שקד ביקשה (15 בספטמבר 2026) לראות את **כל**
 * המנות של יום המכירה עם המלאי והמכירות של כל אחת, ולעדכן את
 * הכמות למכירה מכאן. קודם הייתה שורה אחת מסכמת לכל קטגוריה.
 *
 * ⚠ **הגובה כבר לא קבוע** · בקנבס הכרטיס הוא 144 פיקסלים וסגר
 * שורה אחת. עם שבע מנות זה חתך את הרשימה, ולכן הגובה זורם.
 */

const RING = 92;
const R = 38;
const STROKE = 8;

type Props = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  dishes: DishRow[];
  onBump: (id: string, delta: number) => void;
  step: number;
  pct: number;
  hue: string;
  rgb: string;
  sold: number;
  quota: number;
};

export function SalePanel({
  label,
  isOpen,
  onToggle,
  dishes,
  onBump,
  step,
  pct,
  hue,
  rgb,
  sold,
  quota,
}: Props) {
  /* אורך הקשת מתוך היקף המעגל · בדיוק החישוב שבקנבס */
  const c = 2 * Math.PI * R;
  const on = c * Math.max(0, Math.min(1, quota ? sold / quota : 0));

  return (
    <GlassCard style={s.card}>
      <View style={s.head}>
        <Text style={s.day}>{`יום מכירה · ${label}`}</Text>
        <Pressable onPress={onToggle} style={s.toggle} hitSlop={8}>
          <Text style={[s.state, { color: isOpen ? '#437C59' : surface.faint }]}>
            {isOpen ? 'פתוח' : 'סגור'}
          </Text>
          <View style={[s.track, { backgroundColor: isOpen ? '#437C59' : 'rgba(130,112,162,0.28)' }]}>
            <View style={[s.knob, isOpen ? s.knobOn : s.knobOff]} />
          </View>
        </Pressable>
      </View>

      <View style={s.body}>
        <View style={s.ringBox}>
          <Svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`}>
            <Circle cx={46} cy={46} r={R} fill="none" stroke="rgba(130,112,162,0.13)" strokeWidth={STROKE} />
            <Circle
              cx={46}
              cy={46}
              r={R}
              fill="none"
              stroke={hue}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${on.toFixed(1)} ${(c - on).toFixed(1)}`}
              transform="rotate(-90 46 46)"
            />
          </Svg>
          <View style={s.ringText} pointerEvents="none">
            <Text style={s.ringPct}>{`${pct}%`}</Text>
            <Text style={s.ringNote}>נמכר</Text>
          </View>
        </View>

        <View style={s.rows}>
          {dishes.map((d) => (
            <View key={d.id} style={s.row}>
              <View style={[s.dot, { backgroundColor: hue }]} />
              <Text style={s.name} numberOfLines={1}>
                {d.name}
              </Text>
              {/* נמכר מתוך המלאי · המספר משמאל הוא מה שנשאר למכירה */}
              <Text style={s.sold}>{`${d.sold}/`}</Text>
              <View style={[s.pill, { backgroundColor: `rgba(${rgb},0.1)` }]}>
                <Pressable onPress={() => onBump(d.id, -step)} style={s.step} hitSlop={6}>
                  <Text style={[s.stepGlyph, { color: hue }]}>−</Text>
                </Pressable>
                <Text style={s.quota}>{d.quota}</Text>
                <Pressable onPress={() => onBump(d.id, step)} style={s.step} hitSlop={6}>
                  <Text style={[s.stepGlyph, { color: hue }]}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={s.note}>{`נמכר מתוך המלאי · ${sold} מתוך ${quota}`}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  day: { flex: 1, fontSize: 13, fontWeight: '600', color: surface.ink },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  state: { fontSize: 11.5, fontWeight: '600' },
  track: { width: 40, height: 23, borderRadius: 999, justifyContent: 'center' },
  knob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  /* בקנבס הידית נעה מהקצה ההתחלתי · ב-RTL זהו הצד הימני */
  knobOn: { start: 2.5 },
  knobOff: { start: 19.5 },

  body: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8 },
  ringBox: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 15, fontWeight: '600', color: surface.ink },
  ringNote: { fontSize: 9.5, fontWeight: '300', color: surface.faint },

  rows: { flex: 1, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  name: { flex: 1, fontSize: 11.5, color: surface.inkSoft },
  sold: { fontSize: 11.5, fontWeight: '600', color: '#6E6478' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 4, borderRadius: 999 },
  step: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: { fontSize: 12, fontWeight: '700', lineHeight: 14 },
  quota: { minWidth: 22, textAlign: 'center', fontSize: 12.5, fontWeight: '600', color: surface.ink },
  note: { fontSize: 10.5, fontWeight: '300', color: surface.faint, marginTop: 2 },
});

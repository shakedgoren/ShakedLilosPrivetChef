import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import { CATS, DOWS, LEGEND, MONTHS, type DayRecord } from '../../data/adminDays';
import { dayKey } from './useAdminDays';
import { LTR_ROW } from '../ui/ltrRow';

const CELL_GAP = 4;
const PLUM = '#43307A';

type Props = {
  year: number;
  month: number;
  selected: string;
  days: Record<string, DayRecord>;
  onStep: (dir: number) => void;
  onSelect: (k: string) => void;
};

/** צבעי תא היום · יום מכירה נצבע בגוון, יום חסום נשאר אפור */
function cellTone(x: DayRecord, isSelected: boolean) {
  const ck = x.blocked ? x.except ?? null : x.sale ?? null;
  const c = ck ? CATS[ck] : null;

  let bg = 'rgba(255,255,255,0.6)';
  let bd = 'rgba(130,112,162,0.12)';
  let fg: string = surface.inkSoft;
  let weight: '400' | '700' = '400';

  if (x.blocked) {
    bg = 'rgba(130,112,162,0.1)';
    bd = 'rgba(130,112,162,0.16)';
    fg = '#B3ABBD';
  }
  if (c && !x.blocked) {
    bg = `rgba(${c.rgb},0.13)`;
    bd = `rgba(${c.rgb},0.34)`;
    fg = c.deep;
    weight = '700';
  }
  /* יום חסום עם חריגה נשאר אפור · רק המסגרת מרמזת, והנקודה מספרת */
  if (c && x.blocked) bd = `rgba(${c.rgb},0.3)`;
  if (isSelected) bd = PLUM;

  return { bg, bd, fg, weight, dot: c && x.open ? c.hue : null };
}

export function MonthGrid({ year, month, selected, days, onStep, onSelect }: Props) {
  const startDow = new Date(year, month, 1).getDay();
  const inMonth = new Date(year, month + 1, 0).getDate();

  const blanks = Array.from({ length: startDow }, (_, i) => i);
  const dates = Array.from({ length: inMonth }, (_, i) => i + 1);

  return (
    <View>
      <View style={s.nav}>
        <Pressable onPress={() => onStep(1)} style={s.arrow} hitSlop={6}>
          <Text style={s.arrowGlyph}>‹</Text>
        </Pressable>
        <Text style={s.month}>{`${MONTHS[month]} ${year}`}</Text>
        <Pressable onPress={() => onStep(-1)} style={s.arrow} hitSlop={6}>
          <Text style={s.arrowGlyph}>›</Text>
        </Pressable>
      </View>

      <View style={s.grid}>
        {DOWS.map((t) => (
          <View key={t} style={s.cellBox}>
            <Text style={s.dow}>{t}</Text>
          </View>
        ))}
        {blanks.map((i) => (
          <View key={`b-${i}`} style={s.cellBox} />
        ))}
        {dates.map((d) => {
          const k = dayKey(year, month, d);
          const tone = cellTone(days[k] ?? {}, selected === k);
          return (
            <View key={k} style={s.cellBox}>
              <Pressable
                onPress={() => onSelect(k)}
                style={[s.cell, { backgroundColor: tone.bg, borderColor: tone.bd }]}
              >
                <Text style={[s.num, { color: tone.fg, fontWeight: tone.weight }]}>{d}</Text>
                {tone.dot ? <View style={[s.dot, { backgroundColor: tone.dot }]} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={s.legend}>
        {LEGEND.map((l) => (
          <View key={l.text} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: l.color }]} />
            <Text style={s.legendText}>{l.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* בקנבס שורת החודש היא direction: ltr · החץ השמאלי מקדם, הימני מחזיר */
  nav: { flexDirection: LTR_ROW, alignItems: 'center', gap: 8 },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(123,92,188,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlyph: { fontSize: 18, color: PLUM, lineHeight: 20 },
  month: { flex: 1, textAlign: 'center', fontSize: 14.5, fontWeight: '600', color: surface.ink },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  /* שבע עמודות · המרווח נוצר מריפוד התא עצמו, לא מ-gap, כדי לא לגלוש */
  cellBox: { width: `${100 / 7}%`, paddingHorizontal: CELL_GAP / 2, paddingVertical: CELL_GAP / 2 },
  dow: { textAlign: 'center', fontSize: 10.5, fontWeight: '600', color: '#A79FB2' },
  cell: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  num: { fontSize: 13 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 3 },
  legendText: { fontSize: 11, color: surface.muted },
});

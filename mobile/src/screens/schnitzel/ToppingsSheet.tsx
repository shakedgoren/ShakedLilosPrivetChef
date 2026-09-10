import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SCHNITZEL_TYPES } from '../../data/schnitzel';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { TOP_CARD } from '../../data/schnitzelCopy';
import type { Pop } from './useSchnitzelOrder';

const ACCENT = hues.schn;

/** חלונית התוספות · נפתחת אחרי בחירת סוג השניצל */
type Props = { pop: Pop; onToggle: (name: string) => void; onCancel: () => void; onSave: () => void };

export function ToppingsSheet({ pop, onToggle, onCancel, onSave }: Props) {
  const [gridW, setGridW] = useState(0);
  const t = pop ? SCHNITZEL_TYPES[pop.type] : undefined;
  /**
   * שלוש בשורה בחלה הבודדת, שתיים בשורה במארז.
   * שקד ביקשה שבמארז ייצאו איולי עמבה ואיולי עשבי תיבול בשורה
   * אחת, ועלי רוקט ומלפפון חמוץ בשורה שמתחת — וזה בדיוק סדר
   * התוספות של פילה עוף בשתי עמודות.
   */
  const columns = pop?.target === 'box' ? TOP_CARD.boxColumns : TOP_CARD.columns;
  const chipW = gridW ? (gridW - TOP_CARD.gap * (columns - 1)) / columns : undefined;
  if (!pop || !t) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <Text style={s.title}>{t.name}</Text>
          <Text style={s.sub}>מה שמים בחלה?</Text>

          {/* שלוש בשורה · השורה האחרונה ממורכזת, וכל הכרטיסים באותו גודל */}
          <ScrollView
            style={s.list}
            contentContainerStyle={s.grid}
            onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
          >
            {t.tops.map((name) => {
              const on = pop.tops.includes(name);
              return (
                <Pressable
                  key={name}
                  onPress={() => onToggle(name)}
                  style={[
                    s.chip,
                    { width: chipW },
                    {
                      backgroundColor: on ? a(ACCENT.rgb, 0.1) : 'rgba(255,255,255,0.7)',
                      borderColor: on ? a(ACCENT.rgb, 0.42) : 'rgba(130,112,162,0.16)',
                    },
                  ]}
                >
                  <Text style={[s.chipText, on && { color: ACCENT.deep, fontWeight: '600' }]}>{name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={s.row}>
            <Pressable onPress={onCancel} style={[s.btn, s.ghost]}>
              <Text style={s.ghostText}>ביטול</Text>
            </Pressable>
            <Pressable onPress={onSave} style={[s.btn, { backgroundColor: a(ACCENT.rgb, 0.5) }]}>
              <Text style={[s.saveText, { color: ACCENT.deep }]}>הוספה</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(42,36,48,0.34)', justifyContent: 'center', padding: space.lg },
  sheet: { maxHeight: '80%', borderRadius: 28, backgroundColor: '#FEFCFB', padding: space.lg, gap: 4 },
  title: { fontSize: 17, fontWeight: '600', color: surface.ink, lineHeight: 22, textAlign: 'center' },
  sub: { fontSize: type.label, color: surface.muted, textAlign: 'center' },
  list: { marginTop: space.md },
  /* justifyContent מרכז את השורה האחרונה כשהיא לא מלאה */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: TOP_CARD.gap,
    paddingBottom: space.sm,
  },
  chip: {
    minHeight: TOP_CARD.minHeight,
    borderRadius: TOP_CARD.radius,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 13.5, lineHeight: 17, textAlign: 'center', color: surface.inkSoft },
  row: { flexDirection: 'row', gap: 9, marginTop: space.md },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ghost: { backgroundColor: 'rgba(130,112,162,0.09)' },
  ghostText: { fontSize: 14.5, fontWeight: '600', color: surface.inkSoft },
  saveText: { fontSize: 14.5, fontWeight: '600' },
});

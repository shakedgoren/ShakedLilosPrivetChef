import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as I from '../icons';

/** מסך בדיקה זמני · מציג את כל האייקונים שנוצרו מהקנבס */
function Cell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <View style={s.cell}>
      {children}
      <Text style={s.label}>{name}</Text>
    </View>
  );
}

export function IconSheetScreen() {
  /* נספר מהמודול עצמו · אייקון חדש מהקנבס מופיע כאן בלי לגעת בקובץ */
  const icons = Object.entries(I).sort(([a], [b]) => a.localeCompare(b));
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      {icons.map(([name, Glyph]) => (
        <Cell key={name} name={name}>
          <Glyph size={28} />
        </Cell>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 4 },
  cell: { width: 80, height: 74, alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { fontSize: 8.5, color: '#8A8194', textAlign: 'center' },
});

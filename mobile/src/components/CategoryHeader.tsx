import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface, type } from '../theme/tokens';
import { useNav } from '../navigation/store';

/** כותרת מסך הקטגוריה · חץ החזרה, השם והתאריך */
export function CategoryHeader({ title, date }: { title: string; date?: string }) {
  const { back } = useNav();
  return (
    <>
      <Pressable onPress={back} style={s.back} hitSlop={8}>
        <Text style={s.glyph}>›</Text>
      </Pressable>
      <View style={s.head}>
        <Text style={s.title}>{title}</Text>
        {date ? <Text style={s.date}>{date}</Text> : null}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  back: {
    position: 'absolute',
    top: 30,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F4F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  glyph: { fontSize: 24, color: '#6E6478', lineHeight: 26 },
  head: { alignItems: 'center', gap: 2 },
  title: { fontSize: 20, fontWeight: '600', color: surface.ink },
  date: { fontSize: type.label, color: '#7A7080' },
});

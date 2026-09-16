import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { radius, surface } from '../../theme/tokens';

type Props<T extends string> = {
  tabs: { id: T; name: string }[];
  value: T;
  onChange: (id: T) => void;
};

/** מחליף לשוניות · הגלולה הלבנה זזה אל הלשונית הפעילה */
export function Segmented<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <View style={s.bar}>
      {tabs.map((t) => {
        const on = value === t.id;
        return (
          <Pressable key={t.id} onPress={() => onChange(t.id)} style={[s.tab, on && s.tabOn]}>
            <Text
              style={[s.label, { color: on ? '#43307A' : surface.faint, fontWeight: on ? '600' : '400' }]}
            >
              {t.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.08)',
  },
  tab: { flex: 1, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabOn: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 5px rgba(96,80,132,0.3)',
  },
  label: { fontSize: 13.5 },
});

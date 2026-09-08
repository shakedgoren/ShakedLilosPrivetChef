import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, surface, type } from '../theme/tokens';
import { useNav } from '../navigation/store';

/**
 * סרגל הניווט התחתון · מופיע אך ורק כשהמשתמשת מחוברת,
 * בדיוק כמו בקנבס. כשלא מחוברים הוא לא מרונדר בכלל.
 */
const TABS = [
  { key: 'main', label: 'בית' },
  { key: 'orders', label: 'הזמנות' },
  { key: 'profile', label: 'אזור אישי' },
] as const;

export function BottomNav() {
  const { screen, loggedIn, go } = useNav();
  if (!loggedIn) return null;

  return (
    <View style={s.bar}>
      {TABS.map((t) => {
        const on = screen === t.key;
        return (
          <Pressable key={t.key} onPress={() => go(t.key)} style={[s.tab, on && s.tabOn]}>
            <Text style={[s.label, { color: on ? '#7B5CBC' : '#918A9E', fontWeight: on ? '700' : '400' }]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 26,
    right: 18,
    left: 18,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: surface.glassEdge,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tab: { minWidth: 62, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: 'rgba(155,127,212,0.13)' },
  label: { fontSize: type.tiny },
});

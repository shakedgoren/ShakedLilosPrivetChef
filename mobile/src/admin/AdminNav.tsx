import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme/tokens';
import { useNav, type Screen } from '../navigation/store';

/**
 * הנאב-בר של צד הניהול · ארבע לשוניות, בדיוק כמו בתחתית AdminOrders.dc.html.
 * נפרד מהנאב-בר של הלקוחה — לשקד יש מסכים אחרים.
 */
const TABS: { key: Screen; label: string }[] = [
  { key: 'admin', label: 'בית' },
  { key: 'adminOrders', label: 'הזמנות' },
  { key: 'adminStock', label: 'מלאי' },
  { key: 'adminMoney', label: 'כספים' },
];

export function AdminNav() {
  const { screen, go } = useNav();
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
    borderColor: 'rgba(255,255,255,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    shadowColor: '#605084',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    zIndex: 20,
  },
  tab: {
    minWidth: 52,
    height: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: { backgroundColor: 'rgba(155,127,212,0.13)' },
  label: { fontSize: 11 },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, type } from '../theme/tokens';
import { NAV_EDGE, NAV_SHADOW, NAV_STOPS } from '../theme/glass';
import { GlassFill } from './Glass';
import { Home, Receipt, User } from '../icons';
import { useNav } from '../navigation/store';

/**
 * סרגל הניווט התחתון · מופיע אך ורק כשהמשתמשת מחוברת,
 * בדיוק כמו בקנבס. כשלא מחוברים הוא לא מרונדר בכלל.
 */
const TABS = [
  { key: 'main', label: 'בית', Icon: Home },
  { key: 'orders', label: 'הזמנות', Icon: Receipt },
  { key: 'profile', label: 'אזור אישי', Icon: User },
] as const;

/* צבעי הלשונית · מהקנבס · הפעילה סגולה ועבה יותר */
const ON_INK = '#7B5CBC';
const OFF_INK = '#918A9E';
const ON_STROKE = 2;
const OFF_STROKE = 1.7;

export function BottomNav() {
  const { screen, loggedIn, go } = useNav();
  if (!loggedIn) return null;

  return (
    <View style={s.bar}>
      <GlassFill stops={NAV_STOPS} radius={radius.pill} />
      {TABS.map((t) => {
        const on = screen === t.key;
        return (
          <Pressable key={t.key} onPress={() => go(t.key)} style={[s.tab, on && s.tabOn]}>
            <t.Icon size={22} color={on ? ON_INK : OFF_INK} strokeWidth={on ? ON_STROKE : OFF_STROKE} />
            <Text style={[s.label, { color: on ? ON_INK : OFF_INK, fontWeight: on ? '700' : '400' }]}>
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
    borderWidth: 1,
    borderColor: NAV_EDGE,
    boxShadow: NAV_SHADOW,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tab: {
    minWidth: 62,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabOn: { backgroundColor: 'rgba(155,127,212,0.13)' },
  label: { fontSize: type.tiny },
});

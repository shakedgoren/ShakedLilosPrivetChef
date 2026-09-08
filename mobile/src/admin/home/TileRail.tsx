import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { surface } from '../../theme/tokens';
import { AMBER, PLUM, STATE, TILES, type TileKey } from '../../data/adminHome';

/** התג שעל האריח · ענבר לדבר שדורש טיפול, שזיף למספר שגרתי */
const BADGES: Record<TileKey, { value: string | number; tone: typeof AMBER }> = {
  orders: { value: STATE.newOrders, tone: AMBER },
  days: { value: STATE.nextSale, tone: PLUM },
  stock: { value: STATE.lowStock, tone: AMBER },
  shop: { value: STATE.toBuy, tone: PLUM },
  people: { value: STATE.people, tone: PLUM },
  menu: { value: STATE.menuItems, tone: PLUM },
  costs: { value: STATE.costsDue ? '!' : 0, tone: AMBER },
  hist: { value: STATE.buys, tone: PLUM },
};

/** רצועת האריחים · שער לשמונת מסכי הניהול */
export function TileRail({
  onOpen,
  badges,
}: {
  onOpen: (key: TileKey) => void;
  badges?: Record<string, number | string | boolean>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
      {TILES.map((t) => {
        const fallback = BADGES[t.key];
        const raw = badges
          ? t.key === 'costs'
            ? badges.costs
              ? '!'
              : 0
            : badges[t.key]
          : fallback.value;
        const value = raw === true ? '!' : raw === false ? 0 : (raw ?? fallback.value);
        const tone = fallback.tone;
        return (
          <Pressable key={t.key} onPress={() => onOpen(t.key)} style={s.tile}>
            <Svg width={21} height={21} viewBox="0 0 24 24">
              {t.paths.map((d) => (
                <Path
                  key={d}
                  d={d}
                  fill="none"
                  stroke="#6E6478"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
            <Text style={s.name}>{t.name}</Text>
            {value ? (
              <View style={[s.badge, { backgroundColor: tone.bg }]}>
                <Text style={[s.badgeText, { color: tone.fg }]}>{value}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  rail: { gap: 10, paddingBottom: 2 },
  tile: {
    width: 74,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  name: { fontSize: 10.5, fontWeight: '500', color: surface.inkSoft },
  badge: {
    position: 'absolute',
    top: -5,
    /* בקנבס התג יושב בפינה החיצונית · left ב-RTL הוא end */
    end: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 999,
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: '#FCFBFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { surface } from '../../theme/tokens';
import { AMBER, PLUM, STATE, TILES, type TileKey } from '../../data/adminHome';

/** ארבעה אריחים בשורה · שלושה רווחים של 10 ביניהם */
const PER_ROW = 4;
const GAP = 10;
const TILE_W = `calc((100% - ${(PER_ROW - 1) * GAP}px) / ${PER_ROW})` as unknown as number;

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

/**
 * אריחי הניווט · שער לשמונת מסכי הניהול.
 *
 * ⚠ **שתי שורות ולא רצועה** · שקד ביקשה (15 בספטמבר 2026) לראות
 * את כל השמונה בבת אחת: הזמנות · ימי מכירה · מלאי · קניות בשורה
 * הראשונה, ולקוחות · תפריט · עלויות · היסטוריה מתחתיה. בקנבס זו
 * רצועה אופקית נגללת, ובה ארבעת האחרונים היו מחוץ למסך.
 */
export function TileRail({
  onOpen,
  badges,
}: {
  onOpen: (key: TileKey) => void;
  badges?: Record<string, number | string | boolean>;
}) {
  return (
    <View style={s.grid}>
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
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ ארבעה בשורה · הרוחב אחוזי כדי שהשורה תתמלא בכל מסך */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 2 },
  tile: {
    width: TILE_W,
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

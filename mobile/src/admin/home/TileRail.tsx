import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import Svg, { Path } from 'react-native-svg';
import { LAV, SOFT_SHADOW } from './NightSky';
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
 * אריחי הניווט · שער למסכי הניהול שאינם בנאב-בר.
 *
 * ⚠ **שורה אחת של ארבעה** · שקד ביקשה (15 בספטמבר 2026) שבדף
 * הבית יופיעו רק תפריט · עלויות · לקוחות · מלאי. הזמנות, ימי
 * מכירה, קניות וכספים עברו לנאב-בר.
 *
 * ⚠ **היסטוריית הקניות ירדה מכאן** · היא נשארת נגישה מאייקון
 * השעון שבכותרת מסך הקניות.
 */
export function TileRail({
  onOpen,
  badges,
  keys,
}: {
  onOpen: (key: TileKey) => void;
  badges?: Record<string, number | string | boolean>;
  /** אילו אריחים להציג ובאיזה סדר · ברירת המחדל היא כל השמונה */
  keys?: TileKey[];
}) {
  /* ⚠ הסדר הוא של `keys` ולא של `TILES` · שקד קבעה סדר משלה */
  const shown = keys ? keys.map((k) => TILES.find((t) => t.key === k)!).filter(Boolean) : TILES;
  return (
    <View style={s.grid}>
      {shown.map((t) => {
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
                  stroke={LAV.accent}
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
    height: 62,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    boxShadow: SOFT_SHADOW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  name: { fontSize: 10.5, fontWeight: '600', color: LAV.soft },
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
    borderColor: LAV.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
});

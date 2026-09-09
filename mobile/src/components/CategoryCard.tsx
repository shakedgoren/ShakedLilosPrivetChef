import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { a, radius, space, surface, type } from '../theme/tokens';
import { cardEdge, cardOrbShadow, cardShadow } from '../theme/glass';
import type { Category } from '../data/categories';
import { Orb } from './Orb';
import { Photo } from './Photo';

/** תמונת הקטגוריה · שם הקובץ מהטבלה של שקד */
const PHOTO_BY_CATEGORY: Record<string, string> = {
  cous: 'cat-couscous',
  schn: 'cat-schnitzel',
  box: 'cat-boxes',
  fruit: 'cat-fruit',
  chef: 'cat-chef',
};

/** כרטיס הקטגוריה · 342×181, בדיוק כמו בקנבס */
export const CARD = { width: 342, height: 181, gap: 12 } as const;

/** מידות המדליה · הבועה 128, התמונה יושבת בתוכה */
const MEDAL = 128;
/** שלוש החרוזים שנתלים על שפת הבועה · המידות והמיקומים מהקנבס */
const BEADS = [
  { size: 11, top: 8, left: 2 },
  { size: 8, bottom: 20, left: -2 },
  { size: 7, top: 26, right: -2 },
] as const;

type Props = { item: Category; active: boolean; onPress: () => void };

let seq = 0;
const nextId = () => `card${(seq += 1)}`;

export function CategoryCard({ item, active, onPress }: Props) {
  const id = React.useMemo(nextId, []);

  return (
    <Pressable
      onPress={onPress}
      style={[
        s.card,
        {
          borderColor: cardEdge(active),
          boxShadow: cardShadow(item.rgb, active),
          opacity: active ? 1 : 0.35,
          transform: [{ scale: active ? 1 : 0.92 }],
        },
      ]}
    >
      {/* הזכוכית · לבן אלכסוני ומעליו נגיעת צבע מהפינה העליונה */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0.5" y2="0.866">
            <Stop offset="0" stopColor="rgba(255,255,255,0.5)" />
            <Stop offset="0.55" stopColor="rgba(255,255,255,0.2)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0.34)" />
          </LinearGradient>
          <RadialGradient id={`${id}t`} cx="84%" cy="12%" r="110%">
            <Stop offset="0" stopColor={a(item.rgb, 0.24)} />
            <Stop offset="0.68" stopColor={a(item.rgb, 0)} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius.card} fill={`url(#${id}g)`} />
        <Rect x="0" y="0" width="100%" height="100%" rx={radius.card} fill={`url(#${id}t)`} />
      </Svg>

      <View style={s.text}>
        <Text style={s.title}>{item.title}</Text>
        <Text style={[s.sub, { color: item.hue }]}>{item.sub}</Text>
        <Text style={s.desc}>{item.desc}</Text>
      </View>

      {/* המדליה · בועה זוהרת שהתמונה יושבת בתוכה, וחרוזים על השפה */}
      <View style={s.medal}>
        <Orb rgb={item.rgb} size={MEDAL} shadow={cardOrbShadow(item.rgb)} tint={0.26} halo={0.46}>
          <Photo name={PHOTO_BY_CATEGORY[item.key]} rgb={item.rgb} style={s.shot} />
        </Orb>
        {BEADS.map((b, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[
              s.bead,
              b,
              {
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
                backgroundColor: a(item.rgb, 0.34),
                boxShadow: `0 3px 6px -3px ${a(item.rgb, 0.6)}`,
              },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: CARD.width,
    height: CARD.height,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.sm,
  },
  text: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { fontSize: type.title, fontWeight: '600', lineHeight: type.title * 1.1, color: surface.ink },
  sub: { fontSize: type.subtitle, lineHeight: type.subtitle * 1.3, marginTop: 5 },
  desc: { fontSize: type.body, lineHeight: type.body * 1.65, color: surface.muted, marginTop: 6 },
  medal: { width: MEDAL, height: MEDAL, alignSelf: 'center' },
  shot: { width: MEDAL, height: MEDAL, borderRadius: MEDAL / 2, overflow: 'hidden' },
  bead: { position: 'absolute' },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { a, radius, space, surface, type } from '../theme/tokens';
import type { Category } from '../data/categories';
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

type Props = { item: Category; active: boolean; onPress: () => void };

export function CategoryCard({ item, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.card,
        {
          backgroundColor: a(item.rgb, active ? 0.16 : 0.08),
          borderColor: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
          opacity: active ? 1 : 0.35,
          transform: [{ scale: active ? 1 : 0.92 }],
        },
      ]}
    >
      <View style={s.text}>
        <Text style={s.title}>{item.title}</Text>
        <Text style={[s.sub, { color: item.hue }]}>{item.sub}</Text>
        <Text style={s.desc}>{item.desc}</Text>
      </View>

      <Photo name={PHOTO_BY_CATEGORY[item.key]} rgb={item.rgb} style={s.shot} />
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
  shot: { width: 128, height: 128, alignSelf: 'center', borderRadius: 64, overflow: 'hidden' },
});

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CHEF_FULFILLMENT } from '../../data/chef';
import { CategoryHeader } from '../../components/CategoryHeader';
import { Photo } from '../../components/Photo';
import { PhotoStrip } from '../../components/PhotoStrip';
import { CHEF_PHOTOS, TABON_PHOTOS } from '../../data/photos';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useChefOrder } from './useChefOrder';
import { ChefSectionRenderer } from './ChefSectionRenderer';

const ACCENT = hues.chef;

/**
 * שף וטאבון · שתי חבילות, כל אחת שאלון של שישה עמודים.
 * זו הקטגוריה היחידה שפתוחה עד הסוף גם בלי חשבון — החלטה של שקד.
 */
export function ChefScreen() {
  const { go, loggedIn } = useNav();
  const o = useChefOrder();
  const f = useFulfillment(CHEF_FULFILLMENT);

  const onNext = () => {
    if (!o.pageReady) return;
    if (o.lastPage) f.open();
    else o.next();
  };

  if (!o.pkg) {
    return (
      <View style={s.page}>
        <CategoryHeader title="ארוחת שף ועמדת טאבון" date="חוויה אישית" />
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {o.packages.map((p, i) => (
            <Pressable key={p.key} onPress={() => o.openPackage(i)} style={s.card}>
              <Photo name={p.key === 'chef' ? CHEF_PHOTOS[0] : TABON_PHOTOS[0]} rgb={ACCENT.rgb} style={s.shot} />
              <View style={s.cardText}>
                <Text style={s.name}>{p.name}</Text>
                <Text style={s.desc} numberOfLines={3}>
                  {p.desc}
                </Text>
                <Text style={s.price}>{p.price}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <Pressable onPress={o.prev} style={s.back} hitSlop={8}>
        <Text style={s.backGlyph}>›</Text>
      </Pressable>

      <View style={s.head}>
        <Text style={s.title}>{o.pkg.title}</Text>
        <Text style={s.step}>
          שלב {o.page + 1} מתוך {o.pkg.pages.length}
        </Text>
      </View>

      {/* מד התקדמות · כמה מהשאלון כבר מאחורינו */}
      <View style={s.track}>
        <View style={[s.fill, { width: `${((o.page + 1) / o.pkg.pages.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {o.page === 0 ? (
          <PhotoStrip
            names={o.pkg.key === 'chef' ? CHEF_PHOTOS : TABON_PHOTOS}
            height={180}
            rgb={ACCENT.rgb}
          />
        ) : null}

        {o.page === 0 &&
          o.pkg.intro?.map((t, i) => (
            <Text
              key={i}
              style={{ fontSize: parseFloat(t.size), fontWeight: t.w as any, color: t.fg, lineHeight: 20 }}
            >
              {t.text}
            </Text>
          ))}

        {o.sections.map((sec, i) => (
          <ChefSectionRenderer key={`${sec.kind}-${sec.id ?? i}`} s={sec} api={o} />
        ))}
      </ScrollView>

      <View style={s.bar}>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>סה״כ :</Text>
          <Text style={s.total}>{o.total}</Text>
          <Text style={s.currency}>₪</Text>
        </View>
        <Pressable
          onPress={onNext}
          disabled={!o.pageReady}
          style={[s.cta, { backgroundColor: a(ACCENT.rgb, 0.5), opacity: o.pageReady ? 1 : 0.45 }]}
        >
          <Text style={[s.ctaText, { color: ACCENT.deep }]}>{o.lastPage ? 'לבקשת הצעה' : 'המשך'}</Text>
        </Pressable>
      </View>

      <FulfillmentFlow
        f={f}
        lines={o.lines}
        total={o.total}
        accent={ACCENT}
        details={o.pkg ? { category: 'chef', key: o.pkg.key, picks: o.picks } : undefined}
        onHome={() => {
          f.reset();
          o.backToList();
          go(loggedIn ? 'main' : 'guest');
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground, paddingHorizontal: space.lg, paddingTop: 88 },
  back: {
    position: 'absolute',
    top: 30,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F7F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backGlyph: { fontSize: 24, color: '#7A5B3D', lineHeight: 26 },
  head: { alignItems: 'center', gap: 2 },
  title: { fontSize: 20, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  step: { fontSize: type.label, color: '#7A7080' },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.12)',
    marginTop: space.md,
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: 999, backgroundColor: a(ACCENT.rgb, 0.6) },

  body: { paddingVertical: space.lg, gap: space.sm },
  list: { paddingVertical: space.lg, gap: space.md },
  card: {
    flexDirection: 'row',
    gap: space.md,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.14)',
  },
  shot: { width: 76, height: 76, borderRadius: radius.field, overflow: 'hidden' },
  cardText: { flex: 1, gap: 3 },
  name: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  desc: { fontSize: 12, color: surface.muted, lineHeight: 17 },
  price: { fontSize: type.label, fontWeight: '600', color: ACCENT.deep },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
  cta: { height: 46, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15.5, fontWeight: '600' },
});

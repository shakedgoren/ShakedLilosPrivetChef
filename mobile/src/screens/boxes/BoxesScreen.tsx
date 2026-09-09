import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BOXES_FULFILLMENT } from '../../data/boxes';
import { CategoryHeader } from '../../components/CategoryHeader';
import { Photo } from '../../components/Photo';
import { BOX_PHOTOS } from '../../data/photos';
import { BOXES_TITLE, INTRO_BODY, INTRO_CTA, INTRO_TITLE } from '../../data/boxesCopy';
import { LoginGate } from '../../components/LoginGate';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useBoxesOrder } from './useBoxesOrder';
import { SectionRenderer } from './SectionRenderer';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

const ACCENT = hues.box;

/** מארזי ספיישל · רשימת המארזים, ובתוך כל מארז הסעיפים שלו */
export function BoxesScreen() {
  const { go, loggedIn } = useNav();
  const o = useBoxesOrder();
  const f = useFulfillment(BOXES_FULFILLMENT);
  const [gate, setGate] = useState(false);

  const onContinue = () => {
    if (!o.ready) return;
    if (!loggedIn) setGate(true);
    else f.open();
  };

  return (
    <View style={s.page}>
      {o.box ? (
        <>
          <Pressable onPress={o.backToList} style={s.back} hitSlop={8}>
            <Text style={s.backGlyph}>›</Text>
          </Pressable>
          <View style={s.head}>
            <Text style={s.title}>{o.box.title}</Text>
            <Text style={s.date}>{o.box.price}</Text>
          </View>

          <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            {o.box.intro?.map((t, i) => (
              <Text
                key={i}
                style={{ fontSize: parseFloat(t.size), fontWeight: t.w as any, color: t.fg, lineHeight: 20 }}
              >
                {t.text}
              </Text>
            ))}

            {o.box.sections.map((sec, i) => (
              <SectionRenderer
                key={`${sec.kind}-${sec.id ?? i}`}
                s={sec}
                api={o}
                photos={BOX_PHOTOS[o.box?.key ?? ''] ?? []}
              />
            ))}
          </ScrollView>

          <View style={s.bar}>
            <View style={s.totalBox}>
              <Text style={s.totalLabel}>סה״כ :</Text>
              <Text style={s.total}>{o.total}</Text>
              <Text style={s.currency}>₪</Text>
            </View>
            <Pressable
              onPress={onContinue}
              disabled={!o.ready}
              style={[s.cta, { backgroundColor: a(ACCENT.rgb, 0.5), opacity: o.ready ? 1 : 0.45 }]}
            >
              <Text style={[s.ctaText, { color: ACCENT.deep }]}>המשך</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <CategoryHeader title={BOXES_TITLE} />
          <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
            <View style={s.intro}>
              <Text style={s.introTitle}>{INTRO_TITLE}</Text>
              <Text style={s.introBody}>{INTRO_BODY}</Text>
              <Text style={s.introCta}>{INTRO_CTA}</Text>
            </View>

            {o.boxes.map((b, i) => (
              <Pressable key={b.key} onPress={() => o.openBox(i)} style={s.card}>
                <Photo name={BOX_PHOTOS[b.key]?.[0]} rgb={ACCENT.rgb} style={s.shot} />
                <View style={s.cardText}>
                  <Text style={s.name}>{b.name}</Text>
                  <Text style={s.desc} numberOfLines={3}>
                    {b.desc}
                  </Text>
                  <Text style={s.price}>{b.price}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <FulfillmentFlow
        f={f}
        lines={o.lines}
        total={o.total}
        accent={ACCENT}
        details={o.box ? { category: 'box', key: o.box.key, picks: o.picks } : undefined}
        onHome={() => {
          f.reset();
          o.backToList();
          go(loggedIn ? 'main' : 'guest');
        }}
      />

      <LoginGate
        visible={gate}
        accent={ACCENT}
        onCancel={() => setGate(false)}
        onLogin={() => {
          setGate(false);
          go('login');
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  intro: { gap: 6, marginBottom: 12 },
  introTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20, color: surface.ink },
  introBody: { fontSize: 13, fontWeight: '300', lineHeight: 21, color: surface.inkSoft },
  introCta: { fontSize: 13, fontWeight: '500', lineHeight: 18, color: ACCENT.deep },

  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: 88 },
  back: {
    position: 'absolute',
    top: 30,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0F6F2',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backGlyph: { fontSize: 24, color: '#4E6B58', lineHeight: 26 },
  head: { alignItems: 'center', gap: 2 },
  title: { fontSize: 20, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  date: { fontSize: type.label, color: '#7A7080' },

  body: { paddingVertical: space.lg, gap: space.sm },
  list: { paddingVertical: space.lg, gap: space.md },
  card: {
    flexDirection: 'row',
    gap: space.md,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
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

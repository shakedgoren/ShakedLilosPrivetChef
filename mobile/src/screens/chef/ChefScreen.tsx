import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CHEF_FULFILLMENT } from '../../data/chef';
import { CategoryHeader } from '../../components/CategoryHeader';
import { Photo } from '../../components/Photo';
import { PhotoStrip } from '../../components/PhotoStrip';
import { CHEF_PHOTOS, TABON_PHOTOS } from '../../data/photos';
import {
  CARO,
  CHEF_MENU_TITLE,
  INTRO_BODY,
  INTRO_CTA,
  INTRO_TITLE,
  PICK_CTA,
} from '../../data/chefCopy';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useChefOrder } from './useChefOrder';
import { ChefSectionRenderer } from './ChefSectionRenderer';
import { ChevronRight } from '../../icons';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

const ACCENT = hues.chef;

/** הריפודים עד הקרוסלה · 18 מהעמוד ועוד 12 מהכרטיס, משני הצדדים */
const CARO_INSET = (space.lg + 12) * 2;

/**
 * שף וטאבון · שתי חבילות, כל אחת שאלון של שישה עמודים.
 * זו הקטגוריה היחידה שפתוחה עד הסוף גם בלי חשבון — החלטה של שקד.
 */
export function ChefScreen() {
  const { go, loggedIn } = useNav();
  const o = useChefOrder();
  /* הלשונית הפתוחה בתפריט · ארוחת שף או עמדת טאבון */
  const [tab, setTab] = useState(0);
  const f = useFulfillment(CHEF_FULFILLMENT);

  const onNext = () => {
    if (!o.pageReady) return;
    if (o.lastPage) f.open();
    else o.next();
  };

  if (!o.pkg) {
    const chosen = o.packages[tab];
    return (
      <View style={s.page}>
        <CategoryHeader title={CHEF_MENU_TITLE} />
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          <View style={s.intro}>
            <Text style={s.introTitle}>{INTRO_TITLE}</Text>
            <Text style={s.introBody}>{INTRO_BODY}</Text>
            <Text style={s.introCta}>{INTRO_CTA}</Text>
          </View>

          {/* שתי לשוניות · ארוחת שף מול עמדת טאבון */}
          <View style={s.modes}>
            {o.packages.map((p, i) => (
              <Pressable
                key={p.key}
                onPress={() => setTab(i)}
                style={[s.mode, tab === i && s.modeOn]}
              >
                <Text style={[s.modeText, tab === i && s.modeTextOn]}>{p.name}</Text>
              </Pressable>
            ))}
          </View>

          {/* כרטיס המסלול · קרוסלה ואחריה שורות הפירוט */}
          <View style={s.pkgCard}>
            <PhotoStrip
              names={chosen.key === 'chef' ? CHEF_PHOTOS : TABON_PHOTOS}
              height={CARO.height}
              inset={CARO_INSET}
            />
            <View style={s.pkgLines}>
              {(chosen.intro ?? []).map((line) => (
                <Text
                  key={line.text}
                  style={{
                    fontWeight: line.w as '300' | '500' | '600',
                    fontSize: parseFloat(line.size),
                    color: line.fg,
                    lineHeight: parseFloat(line.size) * 1.6,
                    textAlign: 'center',
                  }}
                >
                  {line.text}
                </Text>
              ))}
            </View>

            <Pressable onPress={() => o.openPackage(tab)} style={s.pickCta}>
              <Text style={s.pickCtaText}>{PICK_CTA}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <Pressable onPress={o.prev} style={s.back} hitSlop={8}>
        <ChevronRight size={19} color="#6E6478" strokeWidth={2} />
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
            inset={space.lg * 2}
          />
        ) : null}

        {o.page === 0 &&
          o.pkg.intro?.map((t, i) => (
            <Text
              key={i}
              style={{
                fontSize: parseFloat(t.size),
                fontWeight: t.w as never,
                color: t.fg,
                lineHeight: parseFloat(t.size) * 1.6,
                textAlign: 'center',
              }}
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
  /* המבוא · ממורכז ובאותם מרווחים של הקוסקוס · gap 3 ואז 12 */
  intro: { gap: 3, paddingHorizontal: 4, marginBottom: 12 },
  introTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
    color: surface.ink,
    textAlign: 'center',
  },
  introBody: {
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 20.8,
    color: surface.inkSoft,
    textAlign: 'center',
  },
  introCta: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20.8,
    color: ACCENT.deep,
    textAlign: 'center',
  },

  modes: {
    flexDirection: 'row',
    height: 52,
    padding: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(130,112,162,0.08)',
    marginBottom: 14,
  },
  mode: { flex: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modeOn: { backgroundColor: '#FFFFFF' },
  modeText: { fontSize: 14.5, color: surface.faint },
  modeTextOn: { fontWeight: '600', color: ACCENT.deep },

  pkgCard: {
    borderRadius: 22,
    padding: 12,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  pkgLines: { gap: 3, paddingHorizontal: 4 },
  pickCta: {
    alignSelf: 'center',
    height: 44,
    paddingHorizontal: 26,
    borderRadius: radius.pill,
    backgroundColor: a(ACCENT.rgb, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickCtaText: { fontSize: 14.5, fontWeight: '600', color: ACCENT.deep },

  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: 88 },
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
  /* מרחפת ב-top 30 · אותה שפה של CategoryHeader, כדי שהתוכן
     של כל המסכים הפנימיים יתחיל באותו גובה בדיוק */
  head: {
    position: 'absolute',
    top: 30,
    right: 74,
    left: 74,
    alignItems: 'center',
    gap: 1,
    zIndex: 1,
  },
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

  body: { paddingBottom: space.lg, gap: 6 },
  list: { paddingBottom: space.lg, gap: space.md },
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

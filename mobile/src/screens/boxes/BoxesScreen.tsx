import React, { useState } from 'react';
import { BAR_BOTTOM_WITH_NAV, SCROLL_PAD_NAV } from '../../components/BottomNav';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BOXES_FULFILLMENT } from '../../data/boxes';
import { CategoryHeader } from '../../components/CategoryHeader';
import { Photo } from '../../components/Photo';
import { BOX_PHOTOS } from '../../data/photos';
import { BOXES_TITLE, INTRO_BODY, INTRO_CTA, INTRO_TITLE } from '../../data/boxesCopy';
import { LoginGate } from '../../components/LoginGate';
import { ChevronLeft } from '../../icons';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useBoxesOrder } from './useBoxesOrder';
import { SectionRenderer } from './SectionRenderer';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';
import { ContinueButton } from '../../components/ContinueButton';
import { BackButton } from '../../components/BackButton';

const ACCENT = hues.box;

/** הכותרת נגמרת ב-54 ברשימה · ועוד 14 כמו בקוסקוס */
const LIST_TOP = 70;
/**
 * מסך המארז · כותרת בת שתי שורות, ולכן בקנבס חוזרים ל-88.
 *
 * ⚠ **לא מהקנבס** · שקד ביקשה ״ממש מעט רווח״ מתחת למחיר, כי הוא
 * נחתך כשיורדים למטה. הסיבה נמדדה: הכותרת מרחפת ונגמרת ב-73.5,
 * אבל אזור הגלילה מתחיל ב-70 — כלומר התוכן נגלל **מאחורי** המחיר
 * ונוגע בו. התיקון הוא להוריד את **קצה אזור הגלילה** אל מתחת
 * למחיר, ולא להוסיף ריפוד פנימי.
 *
 * `DETAIL_TOP` הוא הקצה הזה, ו-`DETAIL_PAD` מתקזז מולו באותה
 * מידה — 80 + 16 = 96, בדיוק המקום שבו התיאור עמד קודם. כך
 * מתקבל רווח אמיתי מתחת למחיר בלי רווח כפול מעל התיאור.
 */
const DETAIL_TOP = 80;
const DETAIL_PAD = 16;

/** החץ שבקצה כרטיס המארז · 15 פיקסלים בקנבס */
const CHEV = 15;
const CHEV_INK = '#C1BBCB';
const CHEV_STROKE = 2.4;

/** מארזי ספיישל · רשימת המארזים, ובתוך כל מארז הסעיפים שלו */
export function BoxesScreen() {
  const { go, goLogin, loggedIn } = useNav();
  const o = useBoxesOrder();
  const f = useFulfillment(BOXES_FULFILLMENT);
  const [gate, setGate] = useState(false);

  const onContinue = () => {
    if (!o.ready) return;
    if (!loggedIn) setGate(true);
    else f.open();
  };

  return (
    /* ⚠ מסך המארז מתחיל נמוך יותר מהרשימה · שם הכותרת שורה אחת
       ואין מה לחתוך, וכאן היא שתי שורות עם מחיר מתחתיה. */
    <View style={[s.page, o.box && s.pageDetail]}>
      {o.box ? (
        <>
          {/* ⚠ היה תו טקסט ״›״ ולא אייקון · המסמך סימן את זה כפגם
              ידוע, והמעבר לרכיב המשותף מיישר אותו לשאר המסכים. */}
          <BackButton onPress={o.backToList} tint="#F0F6F2" ink="#4E6B58" />
          <View style={s.head}>
            <Text style={s.title}>{o.box.title}</Text>
            <Text style={s.date}>{o.box.price}</Text>
          </View>

          <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            {/* המבוא של המארז · ממורכז, line-height 1.6, כמו בקנבס */}
            <View style={s.boxIntro}>
              {o.box.intro?.map((t, i) => {
                const size = parseFloat(t.size);
                return (
                  <Text
                    key={i}
                    style={[
                      s.boxIntroText,
                      { fontSize: size, lineHeight: size * 1.6, fontWeight: t.w as never, color: t.fg },
                    ]}
                  >
                    {t.text}
                  </Text>
                );
              })}
            </View>

            {o.box.sections.map((sec, i) => (
              <SectionRenderer
                key={`${sec.kind}-${sec.id ?? i}`}
                s={sec}
                api={o}
                photos={BOX_PHOTOS[o.box?.key ?? ''] ?? []}
              />
            ))}
          </ScrollView>

          <View style={[s.bar, loggedIn && s.barWithNav]}>
            <View style={s.totalBox}>
              <Text style={s.totalLabel}>סה״כ :</Text>
              <Text style={s.total}>{o.total}</Text>
              <Text style={s.currency}>₪</Text>
            </View>
            <ContinueButton onPress={onContinue} accent={ACCENT} disabled={!o.ready} />
          </View>
        </>
      ) : (
        <>
          <CategoryHeader title={BOXES_TITLE} />
          <ScrollView
            contentContainerStyle={[s.list, loggedIn && s.scrollPadNav]}
            showsVerticalScrollIndicator={false}
          >
            <View style={s.intro}>
              <Text style={s.introTitle}>{INTRO_TITLE}</Text>
              <Text style={s.introBody}>{INTRO_BODY}</Text>
              <Text style={s.introCta}>{INTRO_CTA}</Text>
            </View>

            {o.boxes.map((b, i) => (
              <Pressable key={b.key} onPress={() => o.openBox(i)} style={s.card}>
                <Photo name={BOX_PHOTOS[b.key]?.[0]} rgb={ACCENT.rgb} style={s.shot} zoom={false} />
                <View style={s.cardText}>
                  <Text style={s.name}>{b.name}</Text>
                  <Text style={s.desc}>{b.desc}</Text>
                  {/* המחיר בפינה השמאלית התחתונה · text-align: left בקנבס */}
                  <Text style={s.price}>{b.price}</Text>
                </View>
                {/* החץ הקטן בקצה השורה · 15 פיקסלים, בדיוק כמו בקנבס */}
                <ChevronLeft size={CHEV} color={CHEV_INK} strokeWidth={CHEV_STROKE} />
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
          /* goLogin ולא go · כך ההתחברות מחזירה בדיוק לכאן */
          goLogin();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  /* המבוא · ממורכז ובאותו מרווח של הקוסקוס · gap 3 ואז 12 */
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

  /**
   * הריפוד הוא של הרשימה · שם הכותרת שורה אחת, ולכן היא נגמרת
   * ב-54 והתיאור מתחיל 14 אחריה — בדיוק הרווח שיש בקוסקוס בין
   * התאריך לתיאור. במסך המארז הכותרת בת שתי שורות, ולכן הוא
   * מוסיף DETAIL_PAD ומגיע חזרה ל-88.
   */
  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: LIST_TOP },
  pageDetail: { paddingTop: DETAIL_TOP },
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
  date: { fontSize: type.label, color: '#7A7080' },

  body: { paddingTop: DETAIL_PAD, paddingBottom: space.lg, gap: 6 },
  /* ⚠ היה `marginBottom: 12` · הוא נוסף על הריפוד של הכותרת הראשונה
     ונתן לה 42 מעל, מול 30 לכל שאר הכותרות. שקד ביקשה רווח קבוע. */
  boxIntro: { gap: 3, paddingHorizontal: 4 },
  boxIntroText: { textAlign: 'center' },
  list: { paddingBottom: space.lg, gap: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: 22,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
  },
  shot: { width: 60, height: 60, borderRadius: radius.field, overflow: 'hidden' },
  cardText: { flex: 1, minWidth: 0, gap: 4 },
  name: { fontSize: 14.5, fontWeight: '600', lineHeight: 18, color: surface.ink },
  desc: { fontSize: 11, fontWeight: '300', color: surface.muted, lineHeight: 16 },
  price: { fontSize: 12.5, fontWeight: '600', color: ACCENT.hue, textAlign: 'left' },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  /* כשהנאב-בר מוצג השורה עולה מעליו · המיקום מהקנבס */
  barWithNav: { marginBottom: BAR_BOTTOM_WITH_NAV },
  /* אזור גלילה שנגמר בתחתית · חייב לפנות מקום לנאב */
  scrollPadNav: { paddingBottom: SCROLL_PAD_NAV },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
});

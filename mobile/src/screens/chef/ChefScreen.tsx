import React, { useEffect, useRef, useState } from 'react';
import { RollingTotal } from '../../components/RollingTotal';
import { BAR_BOTTOM_WITH_NAV, SCROLL_PAD_NAV } from '../../components/BottomNav';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { apiEnabled } from '../../api/config';
import { COPY, orderError } from '../../api/copy';
import { createOrder } from '../../api/orders';
import { ApiError } from '../../api/types';
import { ChefConfirm } from './ChefConfirm';
import { usePrefill } from '../../navigation/usePrefill';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { useNav } from '../../navigation/store';
import { useChefOrder } from './useChefOrder';
import { ChefSectionRenderer } from './ChefSectionRenderer';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';
import { ContinueButton } from '../../components/ContinueButton';
import { BackButton } from '../../components/BackButton';
import { CapNotice } from './CapNotice';
import { PastaPopup } from './PastaPopup';

const ACCENT = hues.chef;

/* הדף הראשי של פינת השף · שוליים צרים ופחות רווח מתחת לכותרת */
const MENU_SIDE = 12;
const MENU_TOP = 70;

/** הריפודים עד הקרוסלה · שוליי העמוד ועוד 12 מהכרטיס, משני הצדדים */
const CARO_INSET = (MENU_SIDE + 12) * 2;
/** ⚠ לא מהקנבס · היחס שביקשה שקד לקרוסלת פינת השף */
const CARO_RATIO = 300 / 200;

/** ⚠ אינם מהקנבס · שלושת המרווחים שביקשה שקד בפינת השף */
/* כותרת↔תיאור · 5 בקנבס, צמוד יותר לבקשתה */
const INTRO_GAP = 2;
/* המרווח מעל ״בוחרים את המסלול שלכם״ */
const CTA_GAP = 12;
/* המרווח בין פס ההתקדמות לסעיפים */
const TRACK_GAP = 14;

/**
 * שף וטאבון · שתי חבילות, כל אחת שאלון של שישה עמודים.
 * זו הקטגוריה היחידה שפתוחה עד הסוף גם בלי חשבון — החלטה של שקד.
 */
export function ChefScreen() {
  const { go, loggedIn } = useNav();
  const o = useChefOrder();
  /* הלשונית הפתוחה בתפריט · ארוחת שף או עמדת טאבון */
  const [tab, setTab] = useState(0);
  /* בקשת ההצעה נשלחה · מסך הסיום פתוח */
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  /* ⚠ ״להזמין שוב״ · אותה חבילה עם אותן תשובות, בלי התאריך */
  usePrefill('chef', o.loadDetails);
  /**
   * ⚠ מעבר שלב מחזיר את הגלילה לראש העמוד · בלי זה, מי שעבר שלב
   * מתחתית העמוד נחת באמצע העמוד הבא. בקשה של שקד.
   */
  const body = useRef<ScrollView>(null);
  useEffect(() => {
    body.current?.scrollTo({ y: 0, animated: false });
  }, [o.page, o.current]);

  /**
   * ⚠ **אין כאן זרימת מסירה** · עד עכשיו ״לבקשת הצעה״ פתחה את
   * ״איך תרצי לקבל?״ · שעה · כתובת · תשלום, שאין להם מקום בבקשת
   * הצעה. בקנבס העמוד האחרון עובר ישר למסך הסיום, וזה מה שקורה כאן.
   */
  const onNext = async () => {
    if (!o.pageReady || busy) return;
    if (!o.lastPage) {
      o.next();
      return;
    }
    if (!apiEnabled || !o.pkg) {
      setSent(true);
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await createOrder({
        name: String(o.picks.name ?? ''),
        phone: String(o.picks.phone ?? ''),
        details: { category: 'chef', key: o.pkg.key, picks: o.picks },
      });
      setSent(true);
    } catch (e) {
      setErr(e instanceof ApiError ? orderError(e.code, e.message) : COPY.orderFail);
    } finally {
      setBusy(false);
    }
  };

  if (!o.pkg) {
    const chosen = o.packages[tab];
    return (
      <View style={[s.page, s.pageMenu]}>
        <CategoryHeader title={CHEF_MENU_TITLE} />
        <ScrollView
          contentContainerStyle={[s.list, loggedIn && s.scrollPadNav]}
          showsVerticalScrollIndicator={false}
        >
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

          {/* כרטיס המסלול · הכפתור, אחריו הקרוסלה ואז שורות הפירוט */}
          <View style={s.pkgCard}>
            {/* ⚠ הכפתור עלה מעל הקרוסלה ולבש את עיצוב ׮המשךׯ ·
                שתי בקשות של שקד. קודם הוא היה גלולה שטוחה בתחתית. */}
            <ContinueButton
              onPress={() => o.openPackage(tab)}
              accent={ACCENT}
              label={PICK_CTA}
              style={s.pickCta}
            />
            {/* ⚠ **יחס 300×200** · בקשה של שקד (16 בספטמבר 2026).
                היחס נשמר בכל רוחב מסך; `CARO.height` נשאר כנפילה
                לאחור בלבד. */}
            <PhotoStrip
              names={chosen.key === 'chef' ? CHEF_PHOTOS : TABON_PHOTOS}
              height={CARO.height}
              ratio={CARO_RATIO}
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
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <BackButton onPress={o.prev} tint="#F7F1EA" />

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

      <ScrollView ref={body} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* ⚠ אין כאן קרוסלה ואין תיאור · בקנבס ענף `isOpts` מתחיל
            ישר בסעיפים, ושקד ביקשה את זה מפורשות. הקרוסלה והתיאור
            חיים רק בעמוד הראשי, לפני בחירת המסלול. */}
        {o.sections.map((sec, i) => (
          <ChefSectionRenderer key={`${sec.kind}-${sec.id ?? i}`} s={sec} api={o} />
        ))}
      </ScrollView>

      <View style={[s.bar, loggedIn && s.barWithNav]}>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>סה״כ :</Text>
          <RollingTotal value={o.total} style={s.total} />
          <Text style={s.currency}>₪</Text>
        </View>
        <ContinueButton
          onPress={onNext}
          accent={ACCENT}
          disabled={!o.pageReady || busy}
          label={o.lastPage ? 'לבקשת הצעה' : 'המשך'}
        />
      </View>

      {err ? <Text style={s.err}>{err}</Text> : null}

      {/* חלונית הכמות המקסימלית · מוסברת ולא נועלת */}
      <CapNotice note={o.notice} onClose={o.closeNotice} />

      {/* חלונית סוג הפסטה · נפתחת מיד אחרי בחירת רוטב */}
      <PastaPopup
        pop={o.pasta}
        onPick={o.pastaPick}
        onClose={o.closePasta}
        onCommit={o.pastaCommit}
      />

      {/* מסך סיום בקשת ההצעה · `isConfirm` בקנבס */}
      {sent && (
        <ChefConfirm
          pkg={o.pkg}
          picks={o.picks}
          total={o.total}
          onHome={() => {
            setSent(false);
            o.backToList();
            go(loggedIn ? 'main' : 'guest');
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ המרווחים כאן אינם מהקנבס · בקנבס שלוש השורות ב-gap 5 אחיד.
     שקד ביקשה שהכותרת והתיאור יהיו צמודים יותר, ושהשורה
     ״בוחרים את המסלול שלכם״ תקבל מרווח עליון ותהיה גדולה ומודגשת. */
  intro: { gap: INTRO_GAP, paddingHorizontal: 4, marginBottom: 12 },
  introTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
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
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: ACCENT.deep,
    textAlign: 'center',
    marginTop: CTA_GAP,
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
  /* מיקום בלבד · העיצוב, כולל הרווח מהחץ, מגיע מ-`ContinueButton` */
  pickCta: { alignSelf: 'center', marginBottom: 2 },

  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: 88 },
  /**
   * ⚠ שתי בקשות של שקד לדף הראשי של פינת השף:
   * שוליים צרים יותר (18 ← 12), ופחות רווח מתחת לכותרת —
   * הכותרת מרחפת ונגמרת ב-56, ו-88 השאירו 32.5 ריקים.
   * 70 משאיר 14.5, בדיוק הרווח שבשאר המסכים.
   */
  pageMenu: { paddingHorizontal: MENU_SIDE, paddingTop: MENU_TOP },
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
  /* ⚠ המרווח התחתון אינו מהקנבס · שקד ביקשה רווח בין פס
     ההתקדמות לשאר המסך, ובקנבס אין פס התקדמות בכלל */
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.12)',
    marginTop: space.md,
    marginBottom: TRACK_GAP,
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
  /* כשהנאב-בר מוצג השורה עולה מעליו · המיקום מהקנבס */
  barWithNav: { marginBottom: BAR_BOTTOM_WITH_NAV },
  /* אזור גלילה שנגמר בתחתית · חייב לפנות מקום לנאב */
  scrollPadNav: { paddingBottom: SCROLL_PAD_NAV },
  /* שגיאת שליחה · מוצגת מתחת לשורת הסה״כ ולא מחליפה אותה */
  err: { fontSize: type.label, color: '#B95349', textAlign: 'center', marginBottom: 10 },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
});

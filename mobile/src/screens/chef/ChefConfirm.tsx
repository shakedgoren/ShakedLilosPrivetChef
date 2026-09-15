import React from 'react';
import { Animated, Easing, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Confetti } from '../../components/Confetti';
import { ContinueButton } from '../../components/ContinueButton';
import { GlassPanel } from '../../components/Glass';
import { Check } from '../../icons';
import {
  quoteLines,
  quotePerHead,
  quoteRecap,
  type ChefPackage,
} from '../../data/chef';
import { a, hues, surface } from '../../theme/tokens';
import type { Picks } from './useChefOrder';

/**
 * מסך סיום בקשת ההצעה · ענף `isConfirm` ב-Chef.dc.html.
 *
 * ⚠ **זה מה שהיה חסר** · אחרי ״לבקשת הצעה״ נפתחה זרימת המסירה
 * (״איך תרצי לקבל?״ · שעה · כתובת · תשלום), שאין לה שום מקום
 * בבקשת הצעה לארוחת שף. בקנבס הלחיצה על העמוד האחרון עוברת ישר
 * למסך הזה — `next()` שם עושה `step: 6` בלי שלבי מסירה בכלל.
 *
 * ⚠ **אין `backdrop-filter`** · לטשטוש הרקע מאחורי כרטיס הזכוכית
 * אין מקבילה ב-React Native. הגרדיאנט והמסגרת זהים לקנבס.
 * ⚠ **אין `filter: blur`** · ההילה מאחורי עיגול הווי מצוירת
 * כגרדיאנט רדיאלי רך במקום עיגול מטושטש.
 */

/* שטיפת הרקע · שני הכתמים של הקנבס במסך הזה */
const WASH = [
  { rgb: '168,90,40', alpha: 0.14, cx: '50%', cy: '2%', rx: '60%', ry: '34%', fade: 0.66 },
  { rgb: '186,166,228', alpha: 0.06, cx: '12%', cy: '70%', rx: '56%', ry: '34%', fade: 0.64 },
] as const;

/* עיגול הווי · 82 בקנבס, ההילה ב-inset ‎-12, והווי 34 בעובי 2.8 */
const BADGE = 82;
const HALO = 12;
const TICK = 34;
const TICK_STROKE = 2.8;
const RING_BD = 'rgba(168,90,40,0.55)';
const RING_W = 2.5;

/* הנפשות הקנבס · popin, ringout ו-pagein */
const POP_MS = 620;
const POP_DELAY = 120;
const POP_EASE = Easing.bezier(0.34, 1.4, 0.5, 1);
const POP_FROM = 0.4;
const RING_MS = 1000;
const RING_DELAY = 260;
const RING_EASE = Easing.bezier(0.2, 0.7, 0.3, 1);
const RING_FROM = 0.6;
const RING_TO = 2.1;
const RING_ALPHA = 0.75;
const PAGE_MS = 420;
const PAGE_EASE = Easing.bezier(0.22, 0.9, 0.28, 1);
const PAGE_FROM_SCALE = 0.985;
const PAGE_FROM_Y = 10;

/* כרטיס הסיכום · המידות והגוונים מהקנבס */
const CARD_RADIUS = 24;
const CARD_STOPS = ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.54)'] as const;
const CARD_EDGE = 'rgba(255,255,255,0.78)';
const CARD_SHADOW =
  'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 18px 36px -26px rgba(96,80,132,0.6)';
const HEAD_INK = '#A69EAE';
const RECAP_KEY_W = 92;

const ACCENT = hues.chef;

/** ⚠ **טקסט שכתבתי, לא מהקנבס** · שקד ביקשה הערה שניצור קשר לאישור ולמקדמה */
const DEPOSIT_NOTE = 'ניצור איתך קשר לאישור התאריך ולתיאום המקדמה.';

type Props = {
  pkg: ChefPackage;
  picks: Picks;
  total: number;
  onHome: () => void;
};

export function ChefConfirm({ pkg, picks, total, onHome }: Props) {
  const lines = React.useMemo(() => quoteLines(pkg, picks), [pkg, picks]);
  const recap = React.useMemo(() => quoteRecap(pkg, picks), [pkg, picks]);
  const perHead = quotePerHead(pkg, picks);

  const pop = React.useRef(new Animated.Value(0)).current;
  const ring = React.useRef(new Animated.Value(0)).current;
  const page = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const run = (v: Animated.Value, duration: number, delay: number, easing: (t: number) => number) =>
      Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: false });
    Animated.parallel([
      run(page, PAGE_MS, 0, PAGE_EASE),
      run(pop, POP_MS, POP_DELAY, POP_EASE),
      run(ring, RING_MS, RING_DELAY, RING_EASE),
    ]).start();
  }, [page, pop, ring]);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onHome}>
      <Animated.View
        style={[
          s.page,
          {
            opacity: page,
            transform: [
              { scale: page.interpolate({ inputRange: [0, 1], outputRange: [PAGE_FROM_SCALE, 1] }) },
              { translateY: page.interpolate({ inputRange: [0, 1], outputRange: [PAGE_FROM_Y, 0] }) },
            ],
          },
        ]}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              {WASH.map((w, i) => (
                <RadialGradient key={i} id={`cfw${i}`} cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry}>
                  <Stop offset="0" stopColor={a(w.rgb, w.alpha)} />
                  <Stop offset={w.fade} stopColor={a(w.rgb, 0)} />
                </RadialGradient>
              ))}
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={surface.ground} />
            {WASH.map((_, i) => (
              <Rect key={i} x="0" y="0" width="100%" height="100%" fill={`url(#cfw${i})`} />
            ))}
          </Svg>
        </View>

        <Confetti />

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {/* עיגול הווי · הילה, טבעה מתפשטת, ועיגול שקופץ */}
          <View style={s.badge}>
            <View style={s.halo} pointerEvents="none">
              <Svg width="100%" height="100%">
                <Defs>
                  <RadialGradient id="cfhalo" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0" stopColor={a(ACCENT.rgb, 0.42)} />
                    <Stop offset="0.78" stopColor={a(ACCENT.rgb, 0)} />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#cfhalo)" />
              </Svg>
            </View>

            <Animated.View
              style={[
                s.ring,
                {
                  opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [RING_ALPHA, 0] }),
                  transform: [
                    { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [RING_FROM, RING_TO] }) },
                  ],
                },
              ]}
            />

            <Animated.View
              style={[
                s.disc,
                {
                  opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                  transform: [
                    { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [POP_FROM, 1] }) },
                  ],
                },
              ]}
            >
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <RadialGradient id="cfdisc" cx="34%" cy="28%" rx="72%" ry="72%">
                    <Stop offset="0" stopColor="#FAF1E8" />
                    <Stop offset="0.34" stopColor="#EBCFAF" />
                    <Stop offset="1" stopColor="#C08A52" />
                  </RadialGradient>
                  <RadialGradient id="cfgloss" cx="30%" cy="22%" rx="28%" ry="28%">
                    <Stop offset="0" stopColor="rgba(255,255,255,0.96)" />
                    <Stop offset="1" stopColor="rgba(255,255,255,0)" />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" rx={BADGE / 2} fill="url(#cfdisc)" />
                <Rect x="0" y="0" width="100%" height="100%" rx={BADGE / 2} fill="url(#cfgloss)" />
              </Svg>
              {/* ⚠ `zIndex` הכרחי · ה-SVG של הגרדיאנט ממוקם absolute,
                  ולכן בדפדפן הוא נצבע **מעל** אח סטטי. בלי זה הווי
                  נמצא ב-DOM בגודל הנכון אבל אינו נראה. */}
              <View style={s.tick}>
                <Check size={TICK} color={ACCENT.deep} strokeWidth={TICK_STROKE} />
              </View>
            </Animated.View>
          </View>

          <Text style={s.title}>ההזמנה נשלחה</Text>
          <Text style={s.sub}>אישור סופי יישלח בהמשך</Text>

          <GlassPanel
            stops={CARD_STOPS}
            edge={CARD_EDGE}
            shadow={CARD_SHADOW}
            radius={CARD_RADIUS}
            style={s.card}
          >
            <Text style={s.cardHead}>סיכום ההזמנה</Text>

            {lines.map((l) => (
              <View key={l.name} style={s.line}>
                <Text style={s.lineName}>{l.name}</Text>
                <Text style={s.lineSum}>{l.sum} ₪</Text>
              </View>
            ))}

            <View style={s.rule} />

            {recap.map((r) => (
              <View key={r.k} style={s.recap}>
                <Text style={s.recapKey}>{r.k}</Text>
                <Text style={s.recapVal}>{r.v}</Text>
              </View>
            ))}

            <View style={s.rule} />

            <View style={s.line}>
              <Text style={s.totalLabel}>סה״כ</Text>
              <Text style={s.total}>{total}</Text>
              <Text style={s.currency}>₪</Text>
            </View>
            {perHead > 0 && <Text style={s.perHead}>{perHead} ₪ לסועד</Text>}

            {/* ⚠ הערה שכתבתי · אינה בקנבס, שקד ביקשה אותה במפורש */}
            <View style={s.rule} />
            <Text style={s.deposit}>{DEPOSIT_NOTE}</Text>
          </GlassPanel>
        </ScrollView>

        {/* ⚠ בקנבס זו גלולת חול עם גרדיאנט · באפליקציה זה כפתור
            ״המשך״ המשותף ששקד ביקשה בכל מסכי ההזמנה, כמו במסך
            האישור של שאר הקטגוריות. */}
        <View style={s.foot}>
          <ContinueButton onPress={onHome} accent={ACCENT} label="חזרה לדף הבית" />
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground, overflow: 'hidden' },
  /* padding: 44px 20px 0 בקנבס */
  body: { paddingTop: 44, paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center' },

  badge: { width: BADGE, height: BADGE, flexShrink: 0 },
  halo: { position: 'absolute', top: -HALO, right: -HALO, bottom: -HALO, left: -HALO },
  ring: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: BADGE / 2,
    borderWidth: RING_W,
    borderColor: RING_BD,
  },
  disc: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: BADGE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      'inset -6px -8px 16px rgba(122,61,24,0.28)' +
      ', inset 5px 6px 12px rgba(255,255,255,0.95)' +
      ', 0 14px 28px -14px rgba(168,90,40,0.65)',
  },

  tick: { zIndex: 1 },

  title: { fontSize: 22, fontWeight: '600', marginTop: 18, textAlign: 'center', color: surface.ink },
  sub: { fontSize: 13.5, fontWeight: '300', color: surface.muted, marginTop: 5, textAlign: 'center' },

  card: { width: '100%', marginTop: 22, paddingVertical: 16, paddingHorizontal: 18, gap: 11 },
  cardHead: { fontSize: 10.5, letterSpacing: 2.1, fontWeight: '600', color: HEAD_INK },

  line: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  lineName: { flexGrow: 1, flexShrink: 1, fontSize: 13.5, fontWeight: '500', color: surface.ink, lineHeight: 19.6 },
  lineSum: { flexShrink: 0, fontSize: 13.5, fontWeight: '600', color: surface.ink, fontVariant: ['tabular-nums'] },

  rule: { height: 1, backgroundColor: surface.hairline },

  recap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recapKey: { flexShrink: 0, width: RECAP_KEY_W, fontSize: 12, fontWeight: '300', color: surface.muted, lineHeight: 18 },
  recapVal: { flexGrow: 1, flexShrink: 1, fontSize: 12.5, fontWeight: '500', color: surface.ink, lineHeight: 18.75 },

  totalLabel: { flexGrow: 1, fontSize: 14, fontWeight: '600', color: surface.ink },
  total: { fontSize: 20, fontWeight: '600', color: surface.ink, fontVariant: ['tabular-nums'] },
  currency: { fontSize: 13, fontWeight: '400', color: '#7A7080' },
  /* margin-top: -6 בקנבס · המחיר לסועד נצמד לשורת הסה״כ */
  perHead: { marginTop: -6, textAlign: 'left', fontSize: 12, fontWeight: '400', color: surface.muted },

  deposit: { fontSize: 12.5, fontWeight: '300', color: surface.muted, lineHeight: 18.75 },

  /* padding: 0 20px 30px בקנבס */
  foot: { flexShrink: 0, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
});

import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Confetti } from '../../components/Confetti';
import { SuccessCheck } from '../../components/SuccessCheck';
import { GlassPanel } from '../../components/Glass';
import { Photo } from '../../components/Photo';
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

/* הנפשות הקנבס · popin, ringout ו-pagein */
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

/* לוגו החזרה לדף הבית · באותו גובה של חץ החזרה בשאר המסכים */
const LOGO = 46;
const LOGO_TOP = 30;
const LOGO_SIDE = 18;

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

  /* כניסת העמוד · הנפשת הווי עצמה עברה ל-`SuccessCheck` */
  const page = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(page, {
      toValue: 1,
      duration: PAGE_MS,
      easing: PAGE_EASE,
      useNativeDriver: false,
    }).start();
  }, [page]);

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
          {/* ⚠ **וי ההצלחה בעיצוב תנועה חדש** · שקד ביקשה ב-15 בספטמבר
              2026 ״יותר מונפש״. הצבעים והמידות של הקנבס נשמרו; מה
              שהשתנה עבר ל-`SuccessCheck` — שתי טבעות במקום אחת,
              והווי מצייר את עצמו במקום להופיע שלם. */}
          <SuccessCheck accent={ACCENT} />

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

        {/* ⚠ **שונה מהקנבס** · שם יש בתחתית גלולת ״חזרה לדף הבית״.
            שקד ביקשה להוריד אותה, ושהלוגו יישב בפינה הימנית העליונה
            ולחיצה עליו תחזיר לדף הבית. */}
        <Pressable onPress={onHome} style={s.logo} hitSlop={8}>
          <Photo name="logo" style={s.logoShot} zoom={false} resizeMode="contain" />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground, overflow: 'hidden' },
  /* padding: 44px 20px 0 בקנבס */
  body: { paddingTop: 44, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },

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

  /* הלוגו · באותו גובה של חץ החזרה בשאר המסכים */
  logo: {
    position: 'absolute',
    top: LOGO_TOP,
    right: LOGO_SIDE,
    width: LOGO,
    height: LOGO,
    zIndex: 2,
  },
  logoShot: { width: LOGO, height: LOGO, borderRadius: LOGO / 2 },
});

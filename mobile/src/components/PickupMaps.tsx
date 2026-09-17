import React, { useState } from 'react';
import { S } from './Sym';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../ui/text';
import { PICKUP } from '../data/categories';
import { a, radius, space, surface, type } from '../theme/tokens';
import { Photo } from './Photo';
import { iconOrbShadow } from '../theme/glass';
/**
 * מפות ההגעה לחנייה · הכתובת בגדול, הערת הוויז מתחתיה,
 * וארבע המפות עם כותרת הכיוון על התמונה מימין למעלה.
 * ארבע המפות מגיעות מ-design/app/assets · parking-1..4.
 */
/* החצים · אותן מידות של שאר הקרוסלות · 15 בעובי 2.4 */
const ARROW_GLYPH = 15;
const ARROW_STROKE = 2.4;

/**
 * פתיחת הכתובת בוויז.
 *
 * ⚠ **בקשה של שקד (16 בספטמבר 2026)** · ״צריך להוסיף אייקון של וויז
 * ליד הכתובת שפותח את הכתובת נופר 25 יבנה בוויז״.
 *
 * ⚠ **קישור אוניברסלי ולא `waze://`** · הסכמה הפרטית נכשלת בשקט
 * כשהאפליקציה לא מותקנת; הקישור הזה פותח את האפליקציה אם היא
 * קיימת, ואחרת את האתר.
 *
 * ⚠ **הלוגו האמיתי · 17 בספטמבר 2026** · שקד שלחה את הקובץ
 * (`assets/waze-icon.png`). קודם עמד כאן אייקון האיסוף של
 * האפליקציה, כי לוגו הוא סימן מסחר שאסור לצייר בקירוב.
 * הוא מוצג כמו שהוא ואינו נצבע, בדיוק כמו לוגואי התשלום.
 */
const WAZE_ICON = require('../../assets/waze-icon.png');
const WAZE_SIZE = 18;
const WAZE_URL = `https://waze.com/ul?q=${encodeURIComponent(PICKUP.address)}&navigate=yes`;
const openWaze = () => {
  void Linking.openURL(WAZE_URL).catch(() => undefined);
};

/** מרחק אצבע מינימלי שנחשב החלקה · מתחת לזה זו לחיצה */
const SWIPE_PX = 28;

/**
 * ⚠ **מעבר בין המפות · 17 בספטמבר 2026** · בקשה של שקד שיהיה אפקט
 * מעבר בהחלקה ובחצים. אותה ״דהייה וקנה מידה״ שהיא בחרה לפתיחת
 * התמונות, כדי שכל האפליקציה תדבר באותה שפה.
 */
const SWAP_MS = 220;
const SWAP_FROM = 0.94;

export function PickupMaps({ rgb, ink }: { rgb: string; ink: string }) {
  const [i, setI] = useState(0);
  const maps = PICKUP.maps;
  const cur = maps[i];

  const step = (d: number) => setI((n) => (n + d + maps.length) % maps.length);

  /**
   * ⚠ **החלקה בין המפות · בקשה של שקד** · ״צריך לאפשר לעבור בין
   * התמונות עם החלקה של אצבע״. עד עכשיו היו רק חצים ונקודות.
   *
   * ⚠ **`onMoveShouldSet` ולא `onStartShouldSet`** · תפיסה בהתחלה
   * הייתה בולעת את הלחיצה שמגדילה את המפה, ו״להגדיל את התמונות״
   * היא חלק מאותה בקשה. כך אצבע שזזה גוררת, ואצבע שנחה מגדילה.
   *
   * ⚠ הכיוון · תחת RTL גרירה שמאלה היא ״הבא״, כמו בשאר הקרוסלות.
   */
  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 6,
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) < SWIPE_PX) return;
          step(g.dx < 0 ? 1 : -1);
        },
      }),
    [maps.length],
  );

  return (
    <View style={s.wrap}>
      <View style={s.addressRow}>
        <Text style={s.address}>כתובת : {PICKUP.address}</Text>
        <Pressable
          onPress={openWaze}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="פתיחת הכתובת בוויז"
          style={[s.waze, { backgroundColor: a(rgb, 0.12) }]}
        >
          <Image
            source={WAZE_ICON}
            style={s.wazeIcon}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={[s.wazeText, { color: ink }]}>וויז</Text>
        </Pressable>
      </View>
      <Text style={s.note}>{PICKUP.note}</Text>

      <View style={s.frame} {...pan.panHandlers}>
        {/* ⚠ `zoom` דלוק · לחיצה מגדילה את המפה במסך מלא · בקשת שקד */}
        <Swap index={i}>
          <Photo name={cur.file} rgb={rgb} style={s.map} />
        </Swap>

        <View style={s.badge}>
          <Text style={[s.badgeText, { color: ink }]}>{cur.title}</Text>
        </View>

        {/* ⚠ היו כאן תווי טקסט ‹ › · הם **מראה דו-כיוונית**, ולכן
            ב-RTL הדפדפן הפך אותם והחץ הימני הצביע שמאלה. אותם
            אייקוני SVG של שאר הקרוסלות חסינים לזה.
            ⚠ הכיוון החוצה · ימינה בימין ושמאלה בשמאל, כפי ששקד
            ביקשה גם בקרוסלת פינת השף. */}
        <Pressable onPress={() => step(-1)} style={[s.arrow, s.arrowRight]} hitSlop={6}>
          <S k="chevronRight" size={ARROW_GLYPH} color={ink} />
        </Pressable>
        <Pressable onPress={() => step(1)} style={[s.arrow, s.arrowLeft]} hitSlop={6}>
          <S k="chevronLeft" size={ARROW_GLYPH} color={ink} />
        </Pressable>
      </View>

      <View style={s.dots}>
        {maps.map((m, k) => (
          <Pressable
            key={m.file}
            onPress={() => setI(k)}
            style={[
              s.dot,
              { width: k === i ? 18 : 6, backgroundColor: k === i ? ink : 'rgba(130,112,162,0.28)' },
            ]}
            hitSlop={8}
          />
        ))}
      </View>
    </View>
  );
}

/** התמונה המתחלפת · דהייה וקנה מידה · ראו `SWAP_MS` */
function Swap({ index, children }: { index: number; children: React.ReactNode }) {
  /* ⚠ ערך חדש לכל מפה · אסור `setValue` על ערך מחובר לדרייבר הילידי */
  const t = React.useMemo(() => new Animated.Value(0), [index]);
  const [reduce, setReduce] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (reduce) {
      t.setValue(1);
      return;
    }
    Animated.timing(t, {
      toValue: 1,
      duration: SWAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduce, t]);

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [SWAP_FROM, 1] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: t, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: space.sm, marginTop: space.md },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  address: { flexShrink: 1, fontSize: 17, fontWeight: '600', color: surface.ink, lineHeight: 23 },
  waze: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
  },
  wazeIcon: { width: WAZE_SIZE, height: WAZE_SIZE },
  wazeText: { fontSize: 12.5, fontWeight: '700' },
  note: { fontSize: type.label, color: surface.muted, lineHeight: 19 },
  frame: {
    width: '100%',
    height: 190,
    borderRadius: radius.field,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginTop: space.xs,
  },
  map: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  boxShadow: iconOrbShadow('130,112,162'),
  },
  arrowRight: { right: 8 },
  arrowLeft: { left: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.xs },
  dot: { height: 6, borderRadius: 999 },
});

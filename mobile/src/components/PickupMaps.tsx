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
  useWindowDimensions,
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
 * ⚠ **מעבר בין המפות · נכתב מחדש ב-17 בספטמבר 2026** · שקד ביקשה
 * ״אפקט מעבר של תמונות כמו האפקט מעבר תמונות שקיים באייפון״. קודם
 * הייתה כאן ״דהייה וקנה מידה״ — התמונה החדשה נדלקה **במקום**, ולכן
 * לא הייתה שום תחושה של מעבר בין שתי תמונות.
 *
 * עכשיו שתי המפות מוחזקות יחד: **היוצאת מחליקה החוצה והנכנסת
 * נכנסת מהצד ההפוך**, לכיוון שאליו האצבע משכה. בדיוק כמו בגלריה.
 */
const SWAP_MS = 320;
/** ⚠ עקום שמאט לקראת הסוף · אותו של שאר התנועות באפליקציה */
const SWAP_EASE = Easing.bezier(0.22, 0.9, 0.28, 1);

export function PickupMaps({ rgb, ink }: { rgb: string; ink: string }) {
  /**
   * ⚠ **המפה הקודמת והכיוון נשמרים** · בלעדיהם אין מה להחליק החוצה,
   * ואי אפשר לדעת לאיזה צד. `seq` מבדיל בין שתי לחיצות על אותה מפה.
   */
  const [at, setAt] = useState({ i: 0, from: -1, dir: 1, seq: 0 });
  /**
   * מרחק ההחלקה · רוחב המסך.
   *
   * ⚠ **לא נמדד מהפריסה · נמדד בסימולטור ב-17 בספטמבר 2026** · קודם
   * ישב כאן `useState(0)` שהתמלא במדידת הפריסה של המסגרת, והתנועה
   * **קפאה**: ברינדור הראשון הרוחב 0, ולכן התנועה יצאה ״מ-0 ל-0״;
   * הרינדור השני — זה שהביא את הרוחב האמיתי — בנה צמתים מונפשים
   * חדשים **באמצע** הנפשה ילידית שכבר רצה, והיא לא המשיכה.
   * נמדד: עם רוחב קבוע התמונות מחליקות, ועם הנמדד הן קופצות.
   *
   * רוחב המסך זמין כבר ברינדור הראשון. הוא גדול במקצת מהמסגרת,
   * ולכן התמונה נוסעת קצת יותר — והמסגרת חותכת ממילא.
   */
  const { width: travel } = useWindowDimensions();
  const maps = PICKUP.maps;
  const i = at.i;
  const cur = maps[i];

  const step = (d: number) =>
    setAt((p) => ({ i: (p.i + d + maps.length) % maps.length, from: p.i, dir: d, seq: p.seq + 1 }));
  const jump = (k: number) =>
    setAt((p) => (k === p.i ? p : { i: k, from: p.i, dir: k > p.i ? 1 : -1, seq: p.seq + 1 }));

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
        <Swap
          seq={at.seq}
          dir={at.dir}
          width={travel}
          leaving={
            at.from >= 0 && at.from !== i ? (
              /* ⚠ בלי `zoom` · היא בדרך החוצה, ואין מה ללחוץ עליה */
              <Photo name={maps[at.from].file} rgb={rgb} style={s.map} zoom={false} />
            ) : null
          }
          entering={<Photo name={cur.file} rgb={rgb} style={s.map} />}
        />

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
            onPress={() => jump(k)}
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

/**
 * שתי המפות מחליקות יחד · היוצאת החוצה והנכנסת פנימה.
 *
 * ⚠ **הילד הראשון הוא היוצאת והשני הנכנסת** · הסדר הזה הוא החוזה
 * של הרכיב, והוא מה שמאפשר להנפיש את שתיהן מערך אחד.
 *
 * ⚠ **הכיוון** · `dir` חיובי הוא ״הבא״, כלומר האצבע נמשכה שמאלה;
 * אז היוצאת הולכת שמאלה והנכנסת מגיעה מימין. תחת RTL זו אותה
 * מוסכמה של כל הקרוסלות באפליקציה.
 */
function Swap({
  seq,
  dir,
  width,
  leaving,
  entering,
}: {
  seq: number;
  dir: number;
  /** מרחק ההחלקה בנקודות · ראו `travel` */
  width: number;
  /** המפה שעוזבת · `null` בפתיחה הראשונה, כשאין מאיפה לבוא */
  leaving: React.ReactNode;
  entering: React.ReactNode;
}) {
  /* ⚠ ערך חדש לכל מעבר · אסור `setValue` על ערך מחובר לדרייבר הילידי */
  const t = React.useMemo(() => new Animated.Value(0), [seq]);
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
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: SWAP_MS,
      easing: SWAP_EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduce, t]);

  const out = t.interpolate({ inputRange: [0, 1], outputRange: [0, -dir * width] });
  const into = t.interpolate({ inputRange: [0, 1], outputRange: [dir * width, 0] });

  return (
    <>
      {leaving ? (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: out }] }]}>
          {leaving}
        </Animated.View>
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: into }] }]}>
        {entering}
      </Animated.View>
    </>
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

import React, { useState } from 'react';
import { S } from './Sym';
import {
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
import { useReducedMotion } from '../theme/motion';
import { a, radius, space, surface, type } from '../theme/tokens';
import { Photo } from './Photo';
import { iconOrbShadow } from '../theme/glass';
import { NO_TOUCH } from '../theme/pointerEvents';
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
/** תזוזה קטנה מזו היא רעד אצבע ולא גרירה */
const SLOP = 6;
/** מאיזה חלק מהמסגרת ההרפיה משלימה את המעבר */
const COMMIT_AT = 0.32;
/** ומאיזו מהירות היא משלימה גם בלי המרחק */
const COMMIT_VX = 0.4;
const SETTLE_MIN = 110;
const SETTLE_MAX = 340;
/** ⚠ עקום שמאט לקראת הסוף · אותו של שאר התנועות באפליקציה */
const SWAP_EASE = Easing.bezier(0.22, 0.9, 0.28, 1);

export function PickupMaps({ rgb, ink }: { rgb: string; ink: string }) {
  /**
   * ⚠ **המפה הקודמת והכיוון נשמרים** · בלעדיהם אין מה להחליק החוצה,
   * ואי אפשר לדעת לאיזה צד. `seq` מבדיל בין שתי לחיצות על אותה מפה.
   * `step` הוא **הפרש האינדקס** · ‎+1 קדימה, ‎-1 אחורה.
   */
  const [at, setAt] = useState({ i: 0, from: -1, step: -1, seq: 0 });
  /**
   * התקדמות המעבר · 0 = המפה הנוכחית במקומה, 1 = החדשה הגיעה.
   *
   * ⚠ **יושב כאן ולא בתוך `Swap` · 17 בספטמבר 2026** · בקשה של שקד
   * שגם המפות יילכו אחרי האצבע ״כמו ב-iOS״. כשהאצבע מזיזה אותן,
   * **היא** מזיזה את הערך הזה; כשלוחצים על חץ או על נקודה, הוא
   * מונפש לבד. אותו ערך בשני המקרים, ולכן גרירה שנעצרת באמצע
   * ממשיכה מאותה נקודה בדיוק ולא קופצת.
   *
   * ⚠ **בלי הדרייבר הילידי** · אסור `setValue` על ערך שמחובר אליו,
   * והמחווה מעדכנת בכל תזוזת אצבע · אותו שיקול כמו ב-`ScreenStage`.
   */
  const t = React.useRef(new Animated.Value(1)).current;
  /** המפה שהאצבע חושפת כרגע · `null` כשאין גרירה */
  const [preview, setPreview] = useState<{ to: number; step: number } | null>(null);
  /**
   * ⚠ **גם ב-`ref`** · ה-`PanResponder` נבנה פעם אחת, והמטפלים שלו
   * סוגרים על הערכים שהיו באותו רגע. בלי זה `onPanResponderRelease`
   * היה קורא `preview` ריק — כי הגרירה **התחילה** כשהוא היה ריק.
   */
  const previewRef = React.useRef<{ to: number; step: number } | null>(null);
  const dragging = React.useRef(false);
  /** ⚠ נגישות · מי שכיבתה תנועה מקבלת החלפה מיידית, בלי גרירה */
  const still = useReducedMotion();
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

  /** מעבר מונפש · חץ או נקודה. הגרירה עוברת דרך `settle` */
  const run = React.useCallback(
    (to: number, step: number) => {
      setAt((p) => (to === p.i ? p : { i: to, from: p.i, step, seq: p.seq + 1 }));
      t.setValue(0);
      Animated.timing(t, {
        toValue: 1,
        duration: SWAP_MS,
        easing: SWAP_EASE,
        useNativeDriver: false,
      }).start();
    },
    [t],
  );

  const go = (d: number) => run((at.i + d + maps.length) % maps.length, d);
  const jump = (k: number) => run(k, k > at.i ? 1 : -1);

  /**
   * ⚠ **החלקה בין המפות · בקשה של שקד** · ״צריך לאפשר לעבור בין
   * התמונות עם החלקה של אצבע״. עד עכשיו היו רק חצים ונקודות.
   *
   * ⚠ **`onMoveShouldSet` ולא `onStartShouldSet`** · תפיסה בהתחלה
   * הייתה בולעת את הלחיצה שמגדילה את המפה, ו״להגדיל את התמונות״
   * היא חלק מאותה בקשה. כך אצבע שזזה גוררת, ואצבע שנחה מגדילה.
   *
   * ⚠ **הכיוון התהפך · 17 בספטמבר 2026** · שקד: ״ההחלקה עם האצבע
   * לא מעבירה לכיוון הנכון, זה צריך להיות הפוך״. וזה נכון: הנקודות
   * מסודרות מימין לשמאל (הראשונה בימין), ולכן גרירה **שמאלה** מזיזה
   * את הרצועה שמאלה ומגלה את מה שנמצא מימינה — כלומר את המפה
   * ה**קודמת**. עכשיו האצבע והמפות הולכות יחד עם הנקודות.
   */
  /* ⚠ המחווה נבנית פעם אחת · הערכים המשתנים נקראים דרך `ref` */
  const live = React.useRef({ i: at.i, n: maps.length, travel, still });
  live.current = { i: at.i, n: maps.length, travel, still };

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          !live.current.still && Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > SLOP,
        onPanResponderGrant: () => {
          dragging.current = false;
        },
        onPanResponderMove: (_e, g) => {
          const { i: cur0, n, travel: w } = live.current;
          if (!dragging.current) {
            if (Math.abs(g.dx) < SLOP) return;
            /* ⚠ הכיוון נקבע בתזוזה הראשונה ולא משתנה באמצע · אחרת
               המפה שמתחת הייתה מתחלפת תוך כדי גרירה */
            const step = g.dx < 0 ? -1 : 1;
            dragging.current = true;
            previewRef.current = { to: (cur0 + step + n) % n, step };
            setPreview(previewRef.current);
            t.setValue(0);
            return;
          }
          t.setValue(Math.min(1, Math.max(0, Math.abs(g.dx) / w)));
        },
        onPanResponderRelease: (_e, g) => {
          if (!dragging.current) return;
          const { travel: w } = live.current;
          const p = Math.min(1, Math.abs(g.dx) / w);
          const commit = p > COMMIT_AT || Math.abs(g.vx) > COMMIT_VX;
          /* ⚠ המשך נגזר מהמהירות של האצבע · ראו `ScreenStage` */
          const rest = commit ? 1 - p : p;
          const speed = Math.max(Math.abs(g.vx), 0.25) / w;
          const ms = Math.min(SETTLE_MAX, Math.max(SETTLE_MIN, rest / speed));
          Animated.timing(t, {
            toValue: commit ? 1 : 0,
            duration: ms,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (!finished) return;
            dragging.current = false;
            const p2 = previewRef.current;
            if (commit && p2) {
              /* ⚠ המפה כבר במקומה · `from: -1` משחרר את היוצאת
                 ו-`t = 1` שומר עליה שם בלי לקפוץ */
              setAt((prev) => ({ i: p2.to, from: -1, step: p2.step, seq: prev.seq + 1 }));
            }
            previewRef.current = null;
            setPreview(null);
          });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [t],
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
        {/* ⚠ **הכותרת נוסעת עם המפה שלה · 17 בספטמבר 2026** · היא
            ישבה **מחוץ** לשכבה המתחלפת, ולכן היא התחלפה בפריים אחד
            בתחילת המעבר — ובמשך כל ההחלקה נראתה הכותרת החדשה מעל
            המפה הישנה. זה חלק ממה ששקד קראה לו ״משהו שם באפקט לא
            מסתדר טוב״. */}
        <Swap
          t={t}
          /**
           * ⚠ **מנוחה אינה מעבר · נמדד ב-17 בספטמבר 2026** · בלי
           * הדגל הזה מסגרת המפה יצאה **ריקה** אחרי ביטול גרירה:
           * המפה שבמנוחה צוירה לפי אותו ערך התקדמות, ולכן ערך 0
           * הציב אותה מחוץ למסגרת. עכשיו מפה שאינה באמצע מעבר
           * מצוירת פשוט במקומה.
           */
          moving={preview !== null || at.from >= 0}
          step={preview ? preview.step : at.step}
          width={travel}
          leaving={
            /* ⚠ בגרירה **הנוכחית** היא היוצאת, ומתחתיה זו שנחשפת */
            preview ? (
              <MapLayer map={cur} rgb={rgb} ink={ink} />
            ) : at.from >= 0 && at.from !== i ? (
              <MapLayer map={maps[at.from]} rgb={rgb} ink={ink} zoom={false} />
            ) : null
          }
          entering={
            preview ? (
              <MapLayer map={maps[preview.to]} rgb={rgb} ink={ink} zoom={false} />
            ) : (
              <MapLayer map={cur} rgb={rgb} ink={ink} />
            )
          }
        />

        {/* ⚠ היו כאן תווי טקסט ‹ › · הם **מראה דו-כיוונית**, ולכן
            ב-RTL הדפדפן הפך אותם והחץ הימני הצביע שמאלה. אותם
            אייקוני SVG של שאר הקרוסלות חסינים לזה.
            ⚠ הכיוון החוצה · ימינה בימין ושמאלה בשמאל, כפי ששקד
            ביקשה גם בקרוסלת פינת השף. */}
        <Pressable onPress={() => go(-1)} style={[s.arrow, s.arrowRight]} hitSlop={6}>
          <S k="chevronRight" size={ARROW_GLYPH} color={ink} />
        </Pressable>
        <Pressable onPress={() => go(1)} style={[s.arrow, s.arrowLeft]} hitSlop={6}>
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
/** מפה אחת עם הכותרת שלה · שתיהן נוסעות יחד · ראו `Swap` */
function MapLayer({
  map,
  rgb,
  ink,
  zoom = true,
}: {
  map: { file: string; title: string };
  rgb: string;
  ink: string;
  zoom?: boolean;
}) {
  return (
    <>
      <Photo name={map.file} rgb={rgb} style={s.map} zoom={zoom} />
      <View style={[s.badge, NO_TOUCH]}>
        <Text style={[s.badgeText, { color: ink }]}>{map.title}</Text>
      </View>
    </>
  );
}

function Swap({
  t,
  moving,
  step,
  width,
  leaving,
  entering,
}: {
  /** ההתקדמות · האצבע או ההנפשה · ראו `PickupMaps` */
  t: Animated.Value;
  /** יש מעבר באוויר · ראו ההערה במקום השימוש */
  moving: boolean;
  /** הפרש האינדקס · ‎+1 קדימה (שמאלה ברצועה), ‎-1 אחורה (ימינה) */
  step: number;
  /** מרחק ההחלקה בנקודות · ראו `travel` */
  width: number;
  /** המפה שעוזבת · `null` בפתיחה הראשונה, כשאין מאיפה לבוא */
  leaving: React.ReactNode;
  entering: React.ReactNode;
}) {
  /**
   * ⚠ **הצד נגזר מהפרש האינדקס ולא מהאצבע** · הנקודות מסודרות
   * מימין לשמאל, ולכן המפה ה**הבאה** יושבת משמאל לנוכחית: היא
   * נכנסת משמאל והיוצאת מפנה לה מקום ימינה. אחורה — הפוך.
   */
  const out = t.interpolate({ inputRange: [0, 1], outputRange: [0, step * width] });
  const into = t.interpolate({ inputRange: [0, 1], outputRange: [-step * width, 0] });

  /* מפה במנוחה · במקומה, בלי תלות בערך ההתקדמות */
  if (!moving) return <View style={StyleSheet.absoluteFill}>{entering}</View>;

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

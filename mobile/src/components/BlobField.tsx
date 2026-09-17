import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, Filter, FeGaussianBlur, G, Path } from 'react-native-svg';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * רקע הכתמים של מסך ההתחברות · ״שכבות״.
 *
 * ⚠ **לא מהקנבס** · שקד בחרה אותו (16 בספטמבר 2026) מתוך שלושה
 * סבבי תצוגות, ואישרה את עוצמת הזוהר ״בינוני״.
 *
 * ⚠ **הצורות קבועות, רק התנועה מונפשת** · בתצוגה בדפדפן הקצה של
 * הכתם גם מתפתל, כי שם הוא מצויר מחדש בקנבס בכל פריים. במכשיר
 * ציור מחדש של נתיב SVG בכל פריים יקר, ולכן הנתיב מחושב פעם אחת
 * ומה שזז הוא ה-`View` שמעליו — מסלול, קנה מידה ותו לא. זה רץ על
 * הדרייבר הילידי ובלי עבודה ב-JS, והעומק נשמר: מה שקרוב זז הרבה,
 * מה שרחוק כמעט לא.
 *
 * ⚠ **הזוהר הוא הכתם עצמו, מטושטש** · ולא הילה עגולה מאחוריו,
 * שלא הייתה עוקבת אחרי הקצה האורגני. `FeGaussianBlur` נתמך
 * ב-react-native-svg 15 (אומת מול הייצוא של החבילה המותקנת).
 */

/** גל אחד בהיקף הכתם · משרעת, תדר ופאזה */
type Harm = { a: number; k: number; p: number };

type Layer = {
  key: string;
  /** מרכז כשבר מרוחב/גובה המסך */
  cx: number;
  cy: number;
  /** רדיוס כשבר מהצלע הקצרה */
  r: number;
  fill: string;
  glow: string;
  harm: Harm[];
  /** 0 רחוק · 1 קרוב · קובע מסלול, קנה מידה ועוצמת זוהר */
  depth: number;
  /** משך סיבוב מלא במסלול */
  ms: number;
};

const H2: Harm[] = [{ a: 0.2, k: 2, p: 0.6 }, { a: 0.09, k: 4, p: 1.8 }];
const H3: Harm[] = [{ a: 0.16, k: 2, p: 0 }, { a: 0.1, k: 3, p: 1.2 }, { a: 0.06, k: 5, p: 2.3 }];
const H4: Harm[] = [{ a: 0.13, k: 3, p: 0.3 }, { a: 0.09, k: 4, p: 2.1 }, { a: 0.05, k: 6, p: 1.1 }];

/** שלוש השכבות · המספרים הועתקו אחד לאחד מהתצוגה שאושרה */
const LAYERS: Layer[] = [
  { key: 'far', cx: 0.2, cy: 0.1, r: 0.34, fill: '#E2DAF6', glow: '#F1ECFC', harm: H2, depth: 0.35, ms: 26000 },
  { key: 'mid', cx: 0.86, cy: 0.16, r: 0.3, fill: '#C1AEEA', glow: '#DBD0F7', harm: H3, depth: 0.65, ms: 20000 },
  { key: 'near', cx: 0.4, cy: 0.97, r: 0.34, fill: '#8E6FD0', glow: '#B99DF2', harm: H4, depth: 1, ms: 17000 },
];

/** ״בינוני״ · הבחירה של שקד מתוך ארבע עוצמות */
const GLOW = 0.52;
/** שתי מנות זוהר · קרובה וחזקה, רחוקה ורכה */
const GLOW_PASSES = [
  { scale: 1.46, blur: 34, alpha: 0.42 },
  { scale: 1.17, blur: 17, alpha: 0.85 },
];
/** כמה רחוק נעה שכבה קרובה במסלול, בפיקסלים */
const ORBIT_X = 26;
const ORBIT_Y = 20;
const BREATH = 0.07;
/** רזולוציית הנתיב · 132 נקודות נראה חלק ולא עולה כלום, כי זה חד-פעמי */
const STEPS = 132;

/**
 * ⚠ **עודף בד מסביב למסך · 17 בספטמבר 2026** · שקד דיווחה שכשהכתמים
 * זזים ״זה נראה כאילו הדף נחתך״, והציעה בדיוק את הפתרון הזה:
 * שהרקע יהיה מקובע ורק הכתמים יזוזו.
 *
 * הסיבה: כל שכבה ציירה `Svg` **בדיוק בגודל המסך** ואז הזיזה
 * והקטינה אותו. ברגע שהיא נעה 26 פיקסלים או מתכווצת ב-7%, הבד
 * עצמו יוצא מהמסגרת — ובקצה נחשף פס ריק.
 *
 * עכשיו הבד גדול מהמסך מכל צד, והמסגרת חותכת אותו. התנועה
 * מתרחשת **בתוך** עודף הבד ולכן לעולם אינה מגלה קצה.
 *
 * הערך מכסה את שני המקורות: מסלול (26 פיקסלים) והתכווצות של 7%
 * ממסך גבוה.
 */
const BLEED = 72;

/** נתיב סגור של כתם · r(θ) = R·(1 + Σ aᵢ·sin(kᵢθ + φᵢ)) */
function blobPath(cx: number, cy: number, R: number, harm: Harm[]): string {
  let d = '';
  for (let i = 0; i <= STEPS; i++) {
    const a = (i / STEPS) * Math.PI * 2;
    let r = R;
    for (const h of harm) r += h.a * R * Math.sin(h.k * a + h.p);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * מסלול אליפטי מערך אחד · הקלט רץ 0→1 ברצף, והפלט מצייר סיבוב
 * שלם. כך שכבה אחת צריכה אנימציה אחת בלבד, והכול על הדרייבר הילידי.
 */
const ROUND = [0, 0.25, 0.5, 0.75, 1];

function LayerView({ layer, w, h }: { layer: Layer; w: number; h: number }) {
  const t = React.useRef(new Animated.Value(0)).current;
  const [still, setStill] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setStill(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (still) return undefined;
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: layer.ms,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, layer.ms, still]);

  const ax = ORBIT_X * layer.depth;
  const ay = ORBIT_Y * layer.depth;
  const as = BREATH * layer.depth;

  const style = still
    ? undefined
    : {
        transform: [
          { translateX: t.interpolate({ inputRange: ROUND, outputRange: [ax, 0, -ax, 0, ax] }) },
          { translateY: t.interpolate({ inputRange: ROUND, outputRange: [0, ay, 0, -ay, 0] }) },
          { scale: t.interpolate({ inputRange: ROUND, outputRange: [1 + as, 1, 1 - as, 1, 1 + as] }) },
        ],
      };

  const side = Math.min(w, h);
  /* ⚠ הכתם ממוקם ביחס למסך, והבד מוזז כדי לפצות · ראו `BLEED` */
  const cx = layer.cx * w + BLEED;
  const cy = layer.cy * h + BLEED;
  const R = layer.r * side;
  const id = `g${layer.key}`;

  return (
    <Animated.View style={[s.canvas, style, NO_TOUCH]}>
      <Svg width={w + BLEED * 2} height={h + BLEED * 2}>
        <Defs>
          {GLOW_PASSES.map((g, i) => (
            <Filter key={i} id={`${id}${i}`} x="-60%" y="-60%" width="220%" height="220%">
              <FeGaussianBlur stdDeviation={g.blur} />
            </Filter>
          ))}
        </Defs>
        {GLOW_PASSES.map((g, i) => (
          <G key={i} filter={`url(#${id}${i})`}>
            <Path
              d={blobPath(cx, cy, R * g.scale, layer.harm)}
              fill={layer.glow}
              fillOpacity={GLOW * g.alpha}
            />
          </G>
        ))}
        <Path d={blobPath(cx, cy, R, layer.harm)} fill={layer.fill} />
      </Svg>
    </Animated.View>
  );
}

export function BlobField() {
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  return (
    <View
      style={[s.field, NO_TOUCH]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: Math.round(width), h: Math.round(height) });
      }}
    >
      {size.w > 0
        ? LAYERS.map((l) => <LayerView key={l.key} layer={l} w={size.w} h={size.h} />)
        : null}
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ `overflow: hidden` · הכתמים יושבים חלקית מחוץ למסך בכוונה */
  field: { ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }), overflow: 'hidden', backgroundColor: '#FFFFFF' },
  /* ⚠ הבד גדול מהמסך מכל צד · ראו `BLEED` */
  canvas: {
    position: 'absolute',
    top: -BLEED,
    left: -BLEED,
    right: -BLEED,
    bottom: -BLEED,
  },
});

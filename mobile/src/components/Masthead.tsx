import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../ui/text';
import Svg, { Circle, Defs, Line, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { brand, space, type } from '../theme/tokens';
import { MARK_STYLES, type MarkStyleKey } from '../theme/markStyles';

/**
 * הכותרת · עיצוב ״שטיפה״, אופציה 04 מתוך הסבב השני.
 *
 * ⚠ **נבחר על ידי שקד ב-16 בספטמבר 2026** · מתוך חמש תצוגות שהוצגו
 * על צילום אמיתי של מסך הבית. היא ביקשה גם שהכיתוב שמתחת לשם יהיה
 * ״באותו הפונט כמו של הכיתוב בתוך הקטגוריות״.
 *
 * הזהב של השם הוא גרדיאנט על הטקסט עצמו (background-clip: text
 * בקנבס). ב-React Native אין גרדיאנט על טקסט, ולכן השם מצויר ב-SVG.
 */
const MARK_HEIGHT_PAD = 10;
const SUB = 'אוכל ביתי · ארוחות שף · עמדת טאבון';

/**
 * ⚠ **הסגנון הפעיל · 16 בספטמבר 2026** · שקד בחרה שלושה מועמדים
 * מתוך עשר תצוגות מקדימות וביקשה לראות את דף הבית עם כל אחד:
 * `breath` (03 · נשימה), `signature` (05 · חתימה) ו-`home` (10 · בית).
 * עד שתחליט נשאר `anton` — מה שיש היום. **החלפת המילה הזו היא כל
 * מה שצריך**, וכשתיבחר אחת, השתיים האחרות ומשפחות הגופן שלהן יוסרו.
 */
const MARK_STYLE: MarkStyleKey = 'anton';

/** הרווח בין הכיתוב לקווים שלצידו · ״נשימה״ */
const FLANK_GAP = 15;
/** הנקודה והקו שמשני הצדדים · ״בית״ */
const ORN_GAP = 16;
const ORN_DOT = 3;
const ORN_LINE = 20;

export function Masthead() {
  const { width } = useWindowDimensions();
  const v = MARK_STYLES[MARK_STYLE];
  /* ⚠ `HomeScreen` מרפד 18 מכל צד · הלוח צר מהמסך בדיוק בכפולה */
  const band = Math.max(0, width - space.lg * 2);
  const cx = band / 2;
  /* הקצה הימני והשמאלי של הכיתוב · ידוע רק כשהרוחב כפוי */
  const half = ('textWidth' in v ? v.textWidth : 0) / 2;

  return (
    <View style={s.band}>
      {/* ⚠ **שטיפת הזהב הוסרה · 16 בספטמבר 2026** · היא נוספה כשהדף
          היה לבן, כדי לחמם את ראשו. שקד בחרה מאז רקע לילכי לכל
          העמוד, ושתי שכבות צבע זו על זו יצרו פס עכור מעל הכותרת.
          עכשיו הרקע עושה את העבודה, והזהב נשאר בכותרת עצמה. */}
      <Svg width={band} height={v.height + MARK_HEIGHT_PAD}>
        <Defs>
          {/* ⚠ **זהב מטאלי · אנכי · 16 בספטמבר 2026** · שקד שלחה
              תמונת ייחוס וביקשה כותרת בסגנון הזה. הגרדיאנט הקודם היה
              **אופקי** בארבע עצירות, וזה נותן זהב שטוח. מתכת אמיתית
              נקראת מהשתקפות לאורך הגובה: אור בקצה העליון, פס כהה
              באמצע, ברק מתחתיו, וכהה בתחתית. */}
          <LinearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F6E9B0" />
            <Stop offset="0.26" stopColor="#CDA63C" />
            <Stop offset="0.48" stopColor="#8A6A1F" />
            <Stop offset="0.6" stopColor="#DCBA4B" />
            <Stop offset="0.82" stopColor="#F4E5A6" />
            <Stop offset="1" stopColor="#A9812A" />
          </LinearGradient>
        </Defs>

        {/* ״נשימה״ · שני קווים שנמשכים מהכיתוב אל קצוות הלוח */}
        {'flank' in v && v.flank ? (
          <>
            <Line
              x1={0}
              y1={v.baseline - v.size * 0.32}
              x2={cx - half - FLANK_GAP}
              y2={v.baseline - v.size * 0.32}
              stroke={brand.goldInk}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            <Line
              x1={cx + half + FLANK_GAP}
              y1={v.baseline - v.size * 0.32}
              x2={band}
              y2={v.baseline - v.size * 0.32}
              stroke={brand.goldInk}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          </>
        ) : null}

        {/* ״בית״ · נקודה וקו קצר משני צדי השם */}
        {'ornaments' in v && v.ornaments
          ? ([1, -1] as const).map((dir) => {
              const dot = cx + dir * (half + ORN_GAP);
              const y = v.baseline - v.size * 0.3;
              return (
                <React.Fragment key={dir}>
                  <Circle cx={dot} cy={y} r={ORN_DOT} fill={brand.goldMid} />
                  <Line
                    x1={dot + dir * (ORN_DOT + 4)}
                    y1={y}
                    x2={dot + dir * (ORN_DOT + 4 + ORN_LINE)}
                    y2={y}
                    stroke={brand.goldInk}
                    strokeOpacity={0.5}
                    strokeWidth={1}
                  />
                </React.Fragment>
              );
            })
          : null}

        <SvgText
          x={cx}
          y={v.baseline}
          textAnchor="middle"
          fontFamily={v.family}
          fontSize={v.size}
          {...('letterSpacing' in v ? { letterSpacing: v.letterSpacing } : null)}
          {...('textWidth' in v ? { textLength: v.textWidth } : null)}
          fill="url(#gold)"
        >
          {v.text}
        </SvgText>
      </Svg>

      {/* ⚠ הקו הדק מתחת לשם · מופיע בתמונה ששקד שלחה.
          בשלושת המועמדים החדשים יש כבר גבול משלהם, ולכן הוא יורד. */}
      {v.rule ? <View style={[s.rule, { width: v.rule }]} /> : null}
      <Text style={s.sub}>{SUB}</Text>
    </View>
  );
}

/** גוון הכיתוב · זהב כהה שנקרא על השטיפה */
const SUB_INK = '#7A5F22';

const s = StyleSheet.create({
  band: { alignItems: 'center', paddingTop: 16, paddingBottom: 14 },
  /**
   * ⚠ **אותו כיתוב כמו בשורת הקטגוריות** · בקשה מפורשת של שקד.
   * הערכים מועתקים מ-`CategoryRail`: `type.tiny` וגובה שורה של
   * 1.25. מה שהיה כאן קודם היה 18px עם `letterSpacing` של 0.09 —
   * וזה מה שנתן לו מראה אחר מכל שאר האפליקציה.
   */
  rule: {
    height: 1,
    marginTop: 7,
    backgroundColor: brand.goldMid,
    opacity: 0.6,
  },
  sub: {
    fontSize: type.tiny,
    lineHeight: type.tiny * 1.25,
    color: SUB_INK,
    marginTop: 10,
    textAlign: 'center',
  },
});

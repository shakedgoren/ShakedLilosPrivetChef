import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui/text';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { brand, space, stopOf, type } from '../theme/tokens';
import { DISPLAY_FAMILY } from '../theme/fonts';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * הכותרת · עיצוב ״שטיפה״, אופציה 04 מתוך הסבב השני.
 *
 * ⚠ **נבחר על ידי שקד ב-16 בספטמבר 2026** · מתוך חמש תצוגות שהוצגו
 * על צילום אמיתי של מסך הבית. היא ביקשה גם שהכיתוב שמתחת לשם יהיה
 * ״באותו הפונט כמו של הכיתוב בתוך הקטגוריות״.
 *
 * רצועת זהב רכה נמוגה מאחורי הכותרת אל הרקע. זו האופציה היחידה
 * מהחמש שמכניסה צבע לראש העמוד.
 *
 * ⚠ **הרצועה גולשת מעבר לריפוד של העמוד** · `HomeScreen` נותן
 * `paddingHorizontal: space.lg` ו-`paddingTop: space.xxl`, ובלי
 * ההיסטים השליליים כאן הרצועה הייתה מלבן צף עם שוליים לבנים
 * משלושה צדדים במקום שטיפה שיוצאת מהקצה.
 *
 * ⚠ **`stopOf` ולא אלפא בתוך `stopColor`** · `react-native-svg`
 * במכשיר מתעלם מהאלפא שבתוך הצבע, וזה מה שהפך שטיפות אחרות
 * באפליקציה לריבועים אטומים. ראו את ההערה ב-`tokens.ts`.
 *
 * הזהב של השם הוא גרדיאנט על הטקסט עצמו (background-clip: text
 * בקנבס). ב-React Native אין גרדיאנט על טקסט, ולכן השם מצויר ב-SVG.
 */
const MARK = 'BITE & TELL';
const MARK_HEIGHT = 46;
const SUB = 'אוכל ביתי · ארוחות שף · עמדת טאבון';

/** כמה השטיפה נמשכת מתחת לכיתוב לפני שהיא נגמרת */
const WASH_TAIL = 122;

export function Masthead() {
  /**
   * ⚠ **חייב לצאת גם מעבר לאזור הבטוח** · נמדד בסימולטור: בלי
   * `insets.top` השטיפה התחילה בדיוק מתחת לשעון ויצרה **קו אופקי
   * חד** על פני כל הרוחב, במקום להתחיל מקצה המסך. `HomeScreen`
   * יושב בתוך `SafeAreaView` עם `edges={['top']}`, ולכן ההיסט
   * שלמעלה אינו חלק מהעמוד.
   */
  const insets = useSafeAreaInsets();
  const up = insets.top + space.xxl;

  return (
    <View style={s.band}>
      {/* רצועת הזהב · יוצאת אל שלושת הקצוות של המסך */}
      <View style={[s.wash, { top: -up, height: up + WASH_TAIL }, NO_TOUCH]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" {...stopOf('rgba(212,175,55,0.22)')} />
              <Stop offset="0.58" {...stopOf('rgba(212,175,55,0.07)')} />
              <Stop offset="1" {...stopOf('rgba(212,175,55,0)')} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#wash)" />
        </Svg>
      </View>

      <Svg width="100%" height={MARK_HEIGHT}>
        <Defs>
          <LinearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={brand.goldDark} />
            <Stop offset="34%" stopColor={brand.gold} />
            <Stop offset="58%" stopColor={brand.goldMid} />
            <Stop offset="100%" stopColor={brand.goldDark} />
          </LinearGradient>
        </Defs>
        <SvgText
          x="50%"
          y={type.mark}
          textAnchor="middle"
          fontFamily={DISPLAY_FAMILY}
          fontSize={type.mark}
          letterSpacing={0.05 * type.mark}
          fill="url(#gold)"
        >
          {MARK}
        </SvgText>
      </Svg>

      <Text style={s.sub}>{SUB}</Text>
    </View>
  );
}

/** גוון הכיתוב · זהב כהה שנקרא על השטיפה */
const SUB_INK = '#7A5F22';

const s = StyleSheet.create({
  band: { alignItems: 'center', paddingTop: 16, paddingBottom: 14 },
  /* `top` ו-`height` נקבעים בזמן ריצה · הם תלויים באזור הבטוח */
  wash: { position: 'absolute', left: -space.lg, right: -space.lg },
  /**
   * ⚠ **אותו כיתוב כמו בשורת הקטגוריות** · בקשה מפורשת של שקד.
   * הערכים מועתקים מ-`CategoryRail`: `type.tiny` וגובה שורה של
   * 1.25. מה שהיה כאן קודם היה 18px עם `letterSpacing` של 0.09 —
   * וזה מה שנתן לו מראה אחר מכל שאר האפליקציה.
   */
  sub: {
    fontSize: type.tiny,
    lineHeight: type.tiny * 1.25,
    color: SUB_INK,
    marginTop: 10,
    textAlign: 'center',
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { brand, type } from '../theme/tokens';
import { DISPLAY_FAMILY } from '../theme/fonts';

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
 * הזהב של השם הוא גרדיאנט על הטקסט עצמו (background-clip: text
 * בקנבס). ב-React Native אין גרדיאנט על טקסט, ולכן השם מצויר ב-SVG.
 */
const MARK = 'BITE & TELL';
const MARK_HEIGHT = 46;
const SUB = 'אוכל ביתי · ארוחות שף · עמדת טאבון';

/** כמה השטיפה נמשכת מתחת לכיתוב לפני שהיא נגמרת */

export function Masthead() {
  /**
   * ⚠ **חייב לצאת גם מעבר לאזור הבטוח** · נמדד בסימולטור: בלי
   * `insets.top` השטיפה התחילה בדיוק מתחת לשעון ויצרה **קו אופקי
   * חד** על פני כל הרוחב, במקום להתחיל מקצה המסך. `HomeScreen`
   * יושב בתוך `SafeAreaView` עם `edges={['top']}`, ולכן ההיסט
   * שלמעלה אינו חלק מהעמוד.
   */

  return (
    <View style={s.band}>
      {/* ⚠ **שטיפת הזהב הוסרה · 16 בספטמבר 2026** · היא נוספה כשהדף
          היה לבן, כדי לחמם את ראשו. שקד בחרה מאז רקע לילכי לכל
          העמוד, ושתי שכבות צבע זו על זו יצרו פס עכור מעל הכותרת.
          עכשיו הרקע עושה את העבודה, והזהב נשאר בכותרת עצמה. */}
      <Svg width="100%" height={MARK_HEIGHT}>
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

      {/* ⚠ הקו הדק מתחת לשם · מופיע בתמונה ששקד שלחה */}
      <View style={s.rule} />
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
    width: 188,
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

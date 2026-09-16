import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { brand } from '../theme/tokens';
import { DISPLAY_FAMILY } from '../theme/fonts';

/**
 * הכותרת · ״BITE & TELL״ ב-Anton עם הזהב המטאלי של הלוגו.
 *
 * ⚠ **עיצוב ״שורה אחת״ · נבחר ב-16 בספטמבר 2026** · קודם זה היה
 * גוש בן שלוש קומות: כותרת 36px, קו מפריד ברוחב 196 וכיתוב מתחתיו —
 * כ-105 פיקסלים של גובה. שקד בחרה מתוך חמש אופציות את השורה
 * האחת: שם, קו מפריד אנכי, ותיאור — הכול באותו גובה שורה.
 * **הגובה יורד לכ-44 פיקסלים**, וזה מה שמרים את הכרטיס ואת בועות
 * הקטגוריות למעלה.
 *
 * ⚠ **הנוסח לא השתנה** · אותן שתי מחרוזות בדיוק שהיו כאן קודם.
 *
 * הזהב הוא גרדיאנט על הטקסט עצמו (background-clip: text בקנבס).
 * ב-React Native אין גרדיאנט על טקסט, ולכן השם מצויר ב-SVG — זו
 * הדרך היחידה לקבל בדיוק את אותן ארבע עצירות צבע.
 *
 * ⚠ **רוחב קופסת ה-SVG קבוע** · אי אפשר למדוד רוחב של `SvgText`,
 * ולכן הקופסה מוגדרת ידנית ל-`MARK_W` והטקסט ממורכז בתוכה.
 * אם הגופן או הגודל ישתנו — צריך למדוד את זה שוב על המסך.
 */
const MARK = 'BITE & TELL';
const MARK_SIZE = 23;
const MARK_W = 152;
const MARK_H = 26;
const SUB = 'אוכל ביתי · ארוחות שף · עמדת טאבון';

export function Masthead() {
  return (
    /* ⚠ סדר הילדים · תחת RTL הראשון נוחת בימין, ולכן השם מימין
       והתיאור משמאל — בדיוק כמו בתצוגה שנבחרה */
    <View style={s.band}>
      <View style={{ width: MARK_W, height: MARK_H }}>
        <Svg width="100%" height={MARK_H}>
          <Defs>
            <LinearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={brand.goldDark} />
              <Stop offset="40%" stopColor={brand.gold} />
              <Stop offset="64%" stopColor={brand.goldMid} />
              <Stop offset="100%" stopColor={brand.goldDark} />
            </LinearGradient>
          </Defs>
          <SvgText
            x="50%"
            y={MARK_SIZE}
            textAnchor="middle"
            fontFamily={DISPLAY_FAMILY}
            fontSize={MARK_SIZE}
            letterSpacing={0.045 * MARK_SIZE}
            fill="url(#gold)"
          >
            {MARK}
          </SvgText>
        </Svg>
      </View>

      <View style={s.pipe} />
      <Text style={s.sub}>{SUB}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  /* הקו המפריד האנכי · במקום הקו האופקי ברוחב 196 שהיה כאן */
  pipe: { width: 1, height: 17, backgroundColor: brand.goldMid, opacity: 0.6 },
  sub: { fontSize: 11, letterSpacing: 0.055 * 11, color: brand.goldSoft },
});

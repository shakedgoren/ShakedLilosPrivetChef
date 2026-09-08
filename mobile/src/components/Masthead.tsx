import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { brand, type } from '../theme/tokens';
import { DISPLAY_FAMILY } from '../theme/fonts';

/**
 * הכותרת · ״BITE & TELL״ ב-Anton עם הזהב המטאלי של הלוגו, קו מפריד וכיתוב.
 * המיקומים נמדדו בקנבס: הכותרת 36px, הכיתוב 18px, הקו 196px.
 *
 * הזהב הוא גרדיאנט על הטקסט עצמו (background-clip: text בקנבס).
 * ב-React Native אין גרדיאנט על טקסט, ולכן הכותרת מצוירת ב-SVG —
 * זו הדרך היחידה לקבל בדיוק את אותם ארבעה עצירות צבע.
 */
const MARK = 'BITE & TELL';
const MARK_HEIGHT = 46;

export function Masthead() {
  return (
    <View style={s.band}>
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
      <View style={s.rule} />
      <Text style={s.sub}>אוכל ביתי · ארוחות שף · עמדת טאבון</Text>
    </View>
  );
}

const s = StyleSheet.create({
  band: { alignItems: 'center', paddingTop: 22, paddingBottom: 12 },
  rule: { width: 196, height: 1, backgroundColor: brand.goldMid, opacity: 0.75, marginTop: 11 },
  sub: {
    fontSize: type.markSub,
    letterSpacing: 0.09 * 10.5,
    color: brand.goldSoft,
    marginTop: 9,
    textAlign: 'center',
  },
});

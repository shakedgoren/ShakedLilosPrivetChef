import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand, type } from '../theme/tokens';

/**
 * הכותרת · ״BITE & TELL״ בזהב עם קו מפריד וכיתוב מתחתיו.
 * המיקומים נמדדו בקנבס: הכותרת 36px, הכיתוב 18px, הקו 196px.
 * ב-React Native אין gradient על טקסט בלי ספרייה — עד שנוסיף אחת,
 * הזהב הוא הגוון האמצעי של הגרדיאנט (#A9812A), שנקרא זהה על הרקע.
 */
export function Masthead() {
  return (
    <View style={s.band}>
      <Text style={s.mark}>BITE &amp; TELL</Text>
      <View style={s.rule} />
      <Text style={s.sub}>אוכל ביתי · ארוחות שף · עמדת טאבון</Text>
    </View>
  );
}

const s = StyleSheet.create({
  band: { alignItems: 'center', paddingTop: 22, paddingBottom: 12 },
  mark: {
    fontSize: type.mark,
    lineHeight: type.mark,
    letterSpacing: 0.05 * type.mark,
    fontWeight: '700',
    color: brand.goldInk,
  },
  rule: { width: 196, height: 1, backgroundColor: brand.goldMid, opacity: 0.75, marginTop: 11 },
  sub: {
    fontSize: type.markSub,
    letterSpacing: 0.09 * 10.5,
    color: brand.goldSoft,
    marginTop: 9,
    textAlign: 'center',
  },
});

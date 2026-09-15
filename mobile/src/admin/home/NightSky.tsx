import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * שמי הלילה · הרקע המשותף לכרטיסים הכהים בדף הניהול.
 *
 * ⚠ **אינו מהקנבס** · נולד מבחירת ״גלקסיה״ של שקד ללוח יום המכירה
 * (15 בספטמבר 2026), ועבר לכאן כששקד בחרה ״ליל־יום״ — כרטיס
 * המחזור כהה גם הוא, בעוד הרווח והקטגוריות נשארים בהירים.
 *
 * ⚠ **המיקומים קבועים ולא אקראיים** · כוכבים שמוגרלים בכל ציור
 * קופצים ממקום למקום בכל רינדור מחדש של המסך.
 */

/** צבע הלילה · הרקע והמסגרת של כל כרטיס כהה */
export const NIGHT = {
  bg: '#211741',
  edge: 'rgba(184,166,232,0.22)',
  ink: '#EDE6FF',
  dim: '#A294D0',
  faint: '#8E80B8',
  line: '#B79CFF',
} as const;

const STARS = [
  [8, 14], [22, 61], [37, 9], [52, 78], [63, 27], [74, 54],
  [86, 17], [93, 69], [15, 88], [45, 41], [68, 92], [29, 33],
] as const;

export function NightSky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map(([x, y], i) => (
        <View key={i} style={[s.star, { left: `${x}%`, top: `${y}%`, opacity: 0.22 + (i % 4) * 0.13 }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#D7CBFF' },
});

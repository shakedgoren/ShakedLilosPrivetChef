import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * שם התמונה כשכבה על התמונה עצמה · ממורכז לרוחב ולגובה.
 *
 * ⚠ **לא מהקנבס.** בקנבס אין כיתוב על אריחי הקרוסלות. שקד ביקשה
 * שהשם יופיע על כל תמונה בשתי הקרוסלות — דף הבית ופינת השף.
 *
 * ⚠ `pointerEvents="none"` הכרחי · בלעדיו הכיתוב בולע את הלחיצה
 * ורצועת דף הבית מפסיקה לפתוח את התמונה בהגדלה.
 */
type Props = {
  text?: string;
  /** גודל הטקסט · אריח קטן ברצועה מול תמונה רחבה בפינת השף */
  size?: number;
  /**
   * ⚠ `top` לבקשת שקד · בקרוסלת פינת השף הכיתוב יושב בראש התמונה.
   * במרכז התמונה כולה מוכהה; בראש יש רק הצללה עליונה רכה, והתמונה
   * נשארת בהירה.
   */
  align?: 'center' | 'top';
};

/* הצללה מאחורי הטקסט · בלעדיה השם נעלם על תמונות בהירות */
const SHADOW = 'rgba(20,16,12,0.65)';
const SCRIM = 'rgba(20,16,12,0.22)';

/** גובה ההצללה העליונה · מספיק לשורה או שתיים של כיתוב */
const FADE_H = 62;

export function PhotoCaption({ text, size = 13, align = 'center' }: Props) {
  if (!text) return null;

  const top = align === 'top';

  return (
    <View style={[s.wrap, top && s.wrapTop]} pointerEvents="none">
      {top ? (
        <Svg width="100%" height={FADE_H} style={s.fade}>
          <Defs>
            <LinearGradient id="capFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#14100C" stopOpacity={0.5} />
              <Stop offset="1" stopColor="#14100C" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={FADE_H} fill="url(#capFade)" />
        </Svg>
      ) : null}
      <Text style={[s.text, { fontSize: size, lineHeight: size * 1.35 }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: SCRIM,
  },
  /* יישור לראש · בלי הכהיית התמונה כולה */
  wrapTop: { justifyContent: 'flex-start', paddingTop: 10, backgroundColor: 'transparent' },
  fade: { position: 'absolute', top: 0, right: 0, left: 0 },
  text: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: SHADOW,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
};

/* הצללה מאחורי הטקסט · בלעדיה השם נעלם על תמונות בהירות */
const SHADOW = 'rgba(20,16,12,0.65)';
const SCRIM = 'rgba(20,16,12,0.22)';

export function PhotoCaption({ text, size = 13 }: Props) {
  if (!text) return null;

  return (
    <View style={s.wrap} pointerEvents="none">
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
  text: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: SHADOW,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});

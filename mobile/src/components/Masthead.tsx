import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../ui/text';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { brand, space, type } from '../theme/tokens';
import { MARK_STYLES, REF_BAND, type MarkStyleKey } from '../theme/markStyles';

/**
 * הכותרת · ״חתימה״.
 *
 * ⚠ **נבחרה על ידי שקד ב-16 בספטמבר 2026** · מתוך עשר תצוגות
 * מקדימות בגופנים שונים, שמתוכן היא ביקשה לראות שלוש בנויות על
 * האייפון. הכיתוב שמתחת לשם הוא **באותו הגופן של כותרות
 * הקטגוריות** — בקשה מפורשת שלה, וזו הסיבה שהמשקל שם הוא 200.
 *
 * הזהב של השם הוא גרדיאנט על הטקסט עצמו (background-clip: text
 * בקנבס). ב-React Native אין גרדיאנט על טקסט, ולכן השם מצויר ב-SVG.
 */
const SUB = 'אוכל ביתי · ארוחות שף · עמדת טאבון';

/**
 * הסגנון הפעיל.
 * ⚠ `anton` הוא מה שהיה כאן עד ה-16 בספטמבר, והוא נשאר בטבלה
 * כדי שאפשר יהיה לחזור אליו במילה אחת.
 */
const MARK_STYLE: MarkStyleKey = 'signature';

export function Masthead() {
  const { width } = useWindowDimensions();
  const v = MARK_STYLES[MARK_STYLE];
  /* ⚠ `HomeScreen` מרפד 18 מכל צד · הלוח צר מהמסך בדיוק בכפולה */
  const band = Math.max(0, width - space.lg * 2);
  /* המתיחה ביחס למסך הייחוס · ראו `fit` ב-`markStyles` */
  const k = 'fit' in v && v.fit ? band / REF_BAND : 1;

  return (
    <View style={s.band}>
      {/* ⚠ **שטיפת הזהב הוסרה · 16 בספטמבר 2026** · היא נוספה כשהדף
          היה לבן, כדי לחמם את ראשו. שקד בחרה מאז רקע לילכי לכל
          העמוד, ושתי שכבות צבע זו על זו יצרו פס עכור מעל הכותרת.
          עכשיו הרקע עושה את העבודה, והזהב נשאר בכותרת עצמה. */}
      <Svg width={band} height={v.height * k}>
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
          x={band / 2 + ('nudge' in v ? v.nudge : 0) * k}
          y={v.baseline * k}
          textAnchor="middle"
          fontFamily={v.family}
          fontSize={v.size * k}
          {...('letterSpacing' in v ? { letterSpacing: v.letterSpacing } : null)}
          fill="url(#gold)"
        >
          {v.text}
        </SvgText>
      </Svg>

      {/* ⚠ הקו הדק מתחת לשם · היה בתמונה ששקד שלחה לכותרת הקודמת.
          ב״חתימה״ הוא יורד — לכתב יד יש כבר זנב משלו. */}
      {v.rule ? <View style={[s.rule, { width: v.rule }]} /> : null}

      <Text
        style={[s.sub, { fontSize: v.sub.size, fontWeight: v.sub.weight, marginTop: v.sub.gap }]}
      >
        {SUB}
      </Text>
    </View>
  );
}

/** גוון הכיתוב · זהב כהה שנקרא על הרקע הלילכי */
const SUB_INK = '#7A5F22';

const s = StyleSheet.create({
  band: { alignItems: 'center', paddingTop: 16, paddingBottom: 14 },
  rule: {
    height: 1,
    marginTop: 7,
    backgroundColor: brand.goldMid,
    opacity: 0.6,
  },
  /**
   * ⚠ **הגודל, המשקל והרווח מגיעים מהסגנון** · הם שונים בין
   * הכותרות, ולכן הם נקבעים ב-`markStyles` ולא כאן. `type.tiny`
   * נשאר רק כברירת מחדל אם סגנון כלשהו לא יגדיר גודל.
   */
  sub: {
    fontSize: type.tiny,
    color: SUB_INK,
    textAlign: 'center',
  },
});

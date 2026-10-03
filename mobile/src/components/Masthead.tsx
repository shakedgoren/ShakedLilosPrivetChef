import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppWidth } from '../theme/appWidth';
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

/**
 * רוחב עודף של בד ה-SVG בכל צד · במידות של מסך הייחוס.
 *
 * ⚠ **למה זה הוחלף · 3 באוקטובר 2026** · ב-24 בספטמבר נוסף כאן
 * `overflow: 'visible'` בתגובה לדיווח של שקד שהאות ״l״ נחתכת
 * באייפון. היא דיווחה שוב מהאתר בטלפון, כלומר **זה לא הספיק.**
 *
 * ⚠ **למה `overflow` לא אמין כאן** · על `<svg>` שורשי החיתוך נקבע
 * מהחלון של ה-SVG ולא רק מ-CSS, ו-WebKit (ספארי והדפדפן באייפון)
 * לא מכבד שם `overflow: visible` כמו Blink. זו בדיוק הסיבה שהבאג
 * נראה בכרום תקין ובאייפון חתוך.
 *
 * ⚠ **מה שעושים במקום** · הבד עצמו רחב יותר משני הצדדים, והעודף
 * מבוטל במרווח שלילי. הזנב מצויר בתוך הבד ולא חורג ממנו, ולכן
 * אין על מה לוותר לאף מנוע. **המידות והמיקום לא זזו** — הטקסט
 * ממוקם למרכז הבד החדש, שהוא בדיוק מרכז הלוח הישן.
 *
 * ⚠ **24 ולא יותר** · ל-`HomeScreen` יש 18 נקודות ריפוד לכל צד,
 * כלומר לזנב יש לאן לגלוש בלי לגעת בקצה המסך. הבד גדול מהדיו —
 * גודל הבד אינו גודל הכתב, והעודף אינו נראה.
 */
const TAIL_PAD = 24;

export function Masthead() {
  const width = useAppWidth();
  const v = MARK_STYLES[MARK_STYLE];
  /* ⚠ `HomeScreen` מרפד 18 מכל צד · הלוח צר מהמסך בדיוק בכפולה */
  const band = Math.max(0, width - space.lg * 2);
  /* המתיחה ביחס למסך הייחוס · ראו `fit` ב-`markStyles` */
  const k = 'fit' in v && v.fit ? band / REF_BAND : 1;
  /* ⚠ ראו `TAIL_PAD` · נמתח עם המסך, כמו כל שאר המידות */
  const pad = TAIL_PAD * k;
  /* רוחב הבד · הלוח הנראה ועוד מקום לזנב משני הצדדים */
  const canvas = band + pad * 2;

  return (
    <View style={s.band}>
      {/* ⚠ **שטיפת הזהב הוסרה · 16 בספטמבר 2026** · היא נוספה כשהדף
          היה לבן, כדי לחמם את ראשו. שקד בחרה מאז רקע לילכי לכל
          העמוד, ושתי שכבות צבע זו על זו יצרו פס עכור מעל הכותרת.
          עכשיו הרקע עושה את העבודה, והזהב נשאר בכותרת עצמה. */}
      {/**
        * ⚠ **`overflow: visible` · 24 בספטמבר 2026** · שקד דיווחה
        * מהאייפון: ״האות l נחתכת״. באותו רוחב בכרום היא **לא**
        * נחתכת — נמדד שם 13–16 פיקסלים של אוויר מימין לדיו.
        *
        * ⚠ **למה זה תלוי מנוע** · ״Bite & Tell״ בגופן חתימה
        * מסתיימת בזנב מעופף, והדיו שלו חורג מרוחב הפסיעה של
        * האות. כמה בדיוק הוא חורג זו החלטה של מנוע העיצוב, והיא
        * שונה בין Blink (כרום) ל-WebKit (ספארי ואייפון). מסגרת
        * ה-SVG חותכת ברירת מחדל, ולכן ההפרש הקטן הזה הוא ההבדל
        * בין זנב שלם לזנב מגולח.
        *
        * ⚠ **זה לא מקטין ולא מזיז כלום** · המידות נשארות בדיוק
        * כפי ששקד אישרה. רק החיתוך יורד, ולזנב יש 18 נקודות
        * הריפוד של `HomeScreen` לגלוש לתוכן בלי לגעת בקצה המסך.
        */}
      <Svg width={canvas} height={v.height * k} style={[s.mark, { marginHorizontal: -pad }]}>
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
          x={canvas / 2 + ('nudge' in v ? v.nudge : 0) * k}
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
  /**
   * ⚠ `overflow` נשאר · הוא עוזר במנועים שמכבדים אותו, אבל הוא
   * **אינו** מה שפותר את החיתוך. ראו `TAIL_PAD`.
   */
  mark: { overflow: 'visible' },
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

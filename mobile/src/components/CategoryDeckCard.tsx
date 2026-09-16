import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Photo } from './Photo';
import { a, radius, stopOf, surface } from '../theme/tokens';
import type { Category } from '../data/categories';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * כרטיס הקטגוריה בדף הבית · ״דק״.
 *
 * ⚠ **אינו מהקנבס** · בקנבס הכרטיס שוכב (342×181) ומכיל בועה עם
 * חרוזים, זכוכית ונגיעת צבע. שקד בחרה במקומו, אחרי חמישה סבבי
 * תצוגות מקדימות (15 בספטמבר 2026), כרטיס עומד שהתמונה ממלאת
 * אותו, עם גרדיאנט רך והכתב ממורכז מעליו.
 *
 * ⚠ **ירדה התווית הקטנה** · ״כל שלישי״, ״לכל אירוע״, ״בעבודת יד״
 * וכו׳ הופיעו מעל הכותרת והוסרו לבקשתה. הן עדיין חיות בשורת
 * הקטגוריות שמתחת לקרוסלה.
 */

/** מידות הכרטיס · העומד שהחליף את השוכב */
/**
 * ⚠ **הוגדל** · שקד ביקשה (16 בספטמבר 2026) יותר נוכחות לכרטיס
 * הראשי — במכשיר הוא נראה קטן ונשאר מקום פנוי בצדדים. היחס
 * המקורי (‎338/214 = 1.579) נשמר, כך שהתמונה לא נמתחת.
 */
export const CARD = { width: 258, height: 407, gap: 12 } as const;

/** התמונה לכל קטגוריה · שמות הקבצים מהטבלה של שקד */
const PHOTO_BY_CATEGORY: Record<string, string> = {
  cous: 'cat-couscous',
  schn: 'cat-schnitzel',
  box: 'cat-boxes',
  fruit: 'cat-fruit',
  chef: 'cat-chef',
};

/**
 * הגרדיאנט הרך · מתחיל ב-40% מגובה הכרטיס.
 * ⚠ בגרסה קודמת הוא התחיל ב-70% ובאטימות 0.97, ושקד ביקשה פחות
 * כיסוי כדי שהתמונה תיראה. ל-React Native אין גרדיאנט ב-CSS,
 * ולכן הוא מצויר ב-SVG.
 */
const VEIL = '252,251,251';
/**
 * ⚠ העצירות **חייבות לעלות** · הכתובות בסדר יורד נותנות גרדיאנט
 * שבור, והכתב יושב על התמונה בלי רקע. הציר כאן הוא מלמעלה למטה:
 * `offset: 0` הוא ראש הכרטיס.
 *
 * ⚠ **המסך הועמק מתחת לכתב · 16 בספטמבר 2026** · שקד דיווחה פעמיים
 * שהכיתוב ״מטושטש… לא בולט או לא חד״. נמדד: גוש הכתב מתחיל בערך
 * ב-63% מגובה הכרטיס, ושם המסך הישן עמד על **0.63 בלבד** — כלומר
 * השם ישב על תמונה שנראית דרכו.
 *
 * ⚠ **ואז הוחזר לאמצע · אותו יום** · שקד ראתה את המסך האטום וביקשה
 * ״שקיפות באמצע בין מה שהיה קודם לבין מה שיש עכשיו״. כל עצירה כאן
 * היא **הממוצע** של שתי הגרסאות:
 * · תחילת הסגירה · 0.44 ו-0.40 → 0.42
 * · העצירה האמצעית · 0.70/0.86 ו-0.62/0.90 → 0.66/0.88
 * · התחתית · 0.96 ו-1 → 0.98
 */
const VEIL_STOPS = [
  { offset: 0, alpha: 0 },
  { offset: 0.42, alpha: 0 },
  { offset: 0.66, alpha: 0.88 },
  { offset: 0.86, alpha: 0.95 },
  { offset: 1, alpha: 0.98 },
] as const;

/* הצל · עמוק יותר על הקדמי, כדי שיתנתק מהשכנים */
const SHADOW_ON = '0 26px 52px -24px rgba(60,44,92,0.85)';
const SHADOW_OFF = '0 14px 30px -20px rgba(60,44,92,0.6)';

type Props = {
  item: Category;
  active: boolean;
  onPress: () => void;
};

let seq = 0;
const nextId = () => `deck${(seq += 1)}`;

export function CategoryDeckCard({ item, active, onPress }: Props) {
  const id = React.useMemo(nextId, []);

  return (
    <Pressable
      onPress={onPress}
      style={[s.card, { boxShadow: active ? SHADOW_ON : SHADOW_OFF }]}
    >
      <Photo name={PHOTO_BY_CATEGORY[item.key]} rgb={item.rgb} style={s.shot} zoom={false} />

      {/* המסך הרך · מתחת לכתב, מעל התמונה */}
      <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, NO_TOUCH]}>
        <Defs>
          <LinearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
            {VEIL_STOPS.map((v) => (
              <Stop key={v.offset} offset={v.offset} {...stopOf(a(VEIL, v.alpha))} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}v)`} />
      </Svg>

      {/* ⚠ הכתב ממורכז · בקשה מפורשת של שקד */}
      <View style={s.text}>
        <Text style={s.title}>{item.title}</Text>
        {/* ⚠ מודגשת · שקד ביקשה שהכותרות הצבועות יהיו בבולט */}
        <Text style={[s.sub, { color: item.hue }]}>{item.sub}</Text>
        <View style={[s.rule, { backgroundColor: a(item.rgb, 0.4) }]} />
        <Text style={s.desc}>{item.desc}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: CARD.width,
    height: CARD.height,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  shot: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },

  text: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    paddingHorizontal: 13,
    paddingBottom: 15,
    alignItems: 'center',
  },
  /**
   * משקל 200 · הקו הדק שהיא בחרה.
   * ⚠ **הודגש ל-700 והוחזר · 16 בספטמבר 2026** · אחרי שראתה את
   * השם המודגש שקד ביקשה במפורש ״את הכותרת הראשית תשאיר ללא
   * בולט״. ההדגשה עברה לתיאור בלבד.
   */
  title: {
    fontSize: 27,
    fontWeight: '200',
    lineHeight: 29.7,
    color: surface.ink,
    textAlign: 'center',
  },
  sub: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 7,
    textAlign: 'center',
  },
  rule: { width: 42, height: 1, marginTop: 9 },
  /**
   * ⚠ **מודגש · 16 בספטמבר 2026** · בקשה מפורשת של שקד: ההדגשה
   * שייכת **לתיאור** ולא לשם. היה 300.
   * ⚠ הגוון הוחזר ל-`#6E6478` המקורי · היא ביקשה רק את המשקל.
   */
  desc: {
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 16.3,
    color: '#6E6478',
    textAlign: 'center',
    marginTop: 8,
  },
});

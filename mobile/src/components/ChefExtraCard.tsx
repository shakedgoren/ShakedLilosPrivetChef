import React from 'react';
import { S } from './Sym';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Photo } from './Photo';
import { extraPhoto } from '../data/extraPhotos';
import { hues } from '../theme/tokens';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * כרטיס שדרוג · `isCards` בקנבס (`Chef.dc.html`).
 * תמונה ממלאת את הכרטיס, ומעליה מדרג בגוון החול עם השם, התיאור,
 * המחיר ותג התוספת. סימון הבחירה הוא עיגול עם וי בפינה השמאלית
 * העליונה, והמסגרת מתחלפת לגוון השף.
 *
 * ⚠ **התמונות אינן מהקנבס** · שם הכרטיס מציג מציין מקום מקווקו בלבד.
 * המיפוי ב-`extraPhotos.ts` לפי מה ששקד ביקשה. שם בלי מיפוי ממשיך
 * להציג את מציין המקום של הקנבס, בדיוק כמו שם.
 * ⚠ **חסר `backdrop-filter`** · לטשטוש הרקע מאחורי המדרג אין מקבילה
 * ב-React Native. המדרג עצמו זהה לקנבס.
 */

/**
 * גובה הכרטיס · `cardH` בקנבס.
 * ⚠ **מינימום ולא גובה קבוע · תוקן ב-16 בספטמבר 2026** · שקד דיווחה
 * שבעמוד ״אפשר גם להעלות הילוך״ ״לא רואים את מה שאמור להיות שם״.
 * הסיבה: הכרטיס היה בגובה קבוע עם `overflow: hidden`, והכיתוב ישב
 * בשכבה **מוחלטת** שנעוצה לתחתית. תיאורי השדרוגים ארוכים — ״סכו״ם,
 * צלחות, כוסות, מפיות וקשים, כולל תפריט מעוצב ומודפס לכל סועד״ ועוד
 * משפט מחיר — ולכן הם גלשו מעל גבול הכרטיס **ונחתכו**. עכשיו הכיתוב
 * בזרימה רגילה והכרטיס גדל לפיו.
 */
const CARD_H = { one: 250, pair: 208 } as const;
/* גדלי הטיפוגרפיה · `nameSize` ו-`descSize` בקנבס */
const NAME_SIZE = { one: 14.5, pair: 12.5 } as const;
const DESC_SIZE = { one: 12.5, pair: 10 } as const;
/* `descMinH` · מיישר את המחיר בין שני כרטיסים באותה שורה */
const DESC_MIN_H = { one: 0, pair: 58 } as const;

/* גווני הקנבס · `SEL_BD` / `IDLE_BD` וגוון החול של המדרג */
const SEL_BD = 'rgba(168,90,40,0.42)';
const IDLE_BD = 'rgba(130,112,162,0.16)';
const SAND = '#F2D8C0';
/**
 * ⚠ **הלוח אטום, והמעבר יצא ממנו · 16 בספטמבר 2026** · שקד דיווחה
 * פעמיים — ״ארוחת שף פרטית · אפשר גם לשדרג״ ו״עמדת טאבון · אפשר גם
 * לשדרג״ — ש״הפס הכתום נשבר שם ולא רואים את הכיתוב״.
 *
 * הסיבה: המדרג היה **גרדיאנט על כל גובה הלוח**, מ-0 למעלה ועד 0.96
 * למטה. גובה הלוח נגזר מאורך התיאור, ובשדרוגים התיאורים ארוכים —
 * ולכן השם נחת באזור שבו החול שקוף ב-55% בלבד, מעל תמונה בהירה.
 *
 * עכשיו הלוח **אטום מתחת לכל הכתב**, והמעבר הרך הוא רצועה קצרה
 * בגובה קבוע **מעליו**. כך הכתב יושב על רקע מלא בכל אורך תיאור.
 */
const SAND_ALPHA = 0.96;
const SAND_FILL = 'rgba(242,216,192,0.96)';
/** גובה רצועת המעבר · קבוע, ואינו תלוי באורך הטקסט */
const FADE_H = 30;
const INK = '#5E2E12';
const INK_SOFT = '#6B3F22';
const MARK = '#A85A28';

/* עיגול הסימון · 26 בקנבס, והוי בתוכו 14 בעובי 3 */
const TICK = 26;
const TICK_GLYPH = 14;
const TICK_STROKE = 3;

/** המילה שבה הקנבס חותך את התיאור · מה שאחריה הוא המחיר */
const PRICE_AT = 'תוספת';

/**
 * ⚠ **״לסועד״ ליד המחיר · 17 בספטמבר 2026** · בקשה של שקד לשדרוגי
 * עמדת הטאבון: ״ליד המחיר להוסיף את המילה לסועד חוץ מהעיצוב
 * שולחן, ובנוסף להגדיל את המחירים״.
 *
 * ⚠ **התוספת כאן ולא בנתונים** · `data/chef.ts` נוצר אוטומטית
 * מהקנבס, ועריכה ידנית שלו נמחקת בסריקה הבאה.
 *
 * ⚠ החריג נזהה **מהכיתוב עצמו** · עיצוב השולחן מתומחר ״סה״כ״
 * ולא לסועד, ולכן כל תג שכבר אומר ״סה״כ״ נשאר כמו שהוא.
 */
const PER_GUEST = 'לסועד';
const TOTAL_MARK = 'סה״כ';
const badgeWithUnit = (badge: string) =>
  badge.includes(TOTAL_MARK) || badge.includes(PER_GUEST) ? badge : `${badge} ${PER_GUEST}`;

type Props = {
  name: string;
  desc?: string;
  /** `o.p` בקנבס · הכיתוב בתג העגול */
  badge?: string;
  on: boolean;
  /** כרטיס בודד ברוחב מלא · `one: true` בקנבס */
  one?: boolean;
  onPress: () => void;
};

export function ChefExtraCard({ name, desc, badge, on, one = false, onPress }: Props) {
  const k = one ? 'one' : 'pair';
  /* הקנבס חותך את התיאור במילה ״תוספת״ · מה שאחריה יורד לשורת המחיר */
  const d = String(desc ?? '');
  const cut = d.indexOf(PRICE_AT);
  const body = cut > 0 ? d.slice(0, cut).trim() : d;
  const price = cut > 0 ? d.slice(cut).trim() : '';

  return (
    <Pressable
      onPress={onPress}
      style={[s.card, { minHeight: CARD_H[k], borderColor: on ? SEL_BD : IDLE_BD }]}
    >
      {/* ⚠ `zoom={false}` · הלחיצה חייבת לבחור את השדרוג, לא להגדיל */}
      <Photo name={extraPhoto(name)} rgb={hues.chef.rgb} zoom={false} style={s.shot} />

      <View style={s.veil}>
        {/* ⚠ **המעבר יצא מהמדרג · 16 בספטמבר 2026** · ראו ההערה
            ב-`FADE_H`. רצועה קצרה וקבועה **מעל** הלוח, במקום
            גרדיאנט שנמתח לכל גובהו. */}
        <Svg style={[s.fade, NO_TOUCH]} width="100%" height={FADE_H}>
          <Defs>
            <LinearGradient id="extraFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={SAND} stopOpacity={0} />
              <Stop offset="55%" stopColor={SAND} stopOpacity={0.62} />
              <Stop offset="100%" stopColor={SAND} stopOpacity={SAND_ALPHA} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={FADE_H} fill="url(#extraFade)" />
        </Svg>

        <Text numberOfLines={1} style={[s.name, { fontSize: NAME_SIZE[k] }]}>
          {name}
        </Text>
        <Text
          style={[s.desc, { fontSize: DESC_SIZE[k], lineHeight: DESC_SIZE[k] * 1.5, minHeight: DESC_MIN_H[k] }]}
        >
          {body}
        </Text>
        {price ? (
          <Text style={[s.price, { fontSize: DESC_SIZE[k], lineHeight: DESC_SIZE[k] * 1.5 }]}>
            {price}
          </Text>
        ) : null}
        {badge ? (
          <View style={s.badge}>
            <Text numberOfLines={1} style={s.badgeText}>
              {badgeWithUnit(badge)}
            </Text>
          </View>
        ) : null}
      </View>

      {on ? (
        <View style={s.tick}>
          <S k="check" size={TICK_GLYPH} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    /* הכיתוב נצמד לתחתית · והכרטיס גדל כשהוא ארוך */
    justifyContent: 'flex-end',
  },
  /* התמונה ממלאת את הכרטיס · מציין המקום של הקנבס נשאר כשאין תמונה */
  /**
   * `border-radius: 18` · המסגרת המקווקוות של מציין המקום בקנבס.
   * ⚠ `width`/`height` חייבים להיות כאן · עם `top/right/bottom/left`
   * לבד ה-Image ב-React Native Web יוצא בגודל הטבעי של הקובץ —
   * נמדד 1536×1024 בכרטיס של 172×208, כלומר שולי הכרטיס נבלעים.
   * ה-`cover` עצמו מגיע מ-`resizeMode` ולא צריך `objectFit` מפורש.
   */
  shot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  /* `padding: 26px 10px 11px` · המרווח העליון נותן למדרג להתחיל רך */
  /* ⚠ **בזרימה ולא מוחלט** · ראו את ההערה ב-`CARD_H`. */
  /**
   * ⚠ הריפוד העליון ירד מ-26 ל-10 · הוא היה קיים כדי לתת למדרג
   * ״להתחיל רך״, וזה עבר לרצועה שמעל הלוח.
   */
  veil: {
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 11,
    alignItems: 'center',
    gap: 3,
    backgroundColor: SAND_FILL,
  },
  /* ⚠ **מעל הלוח ולא בתוכו** · `top` שלילי · ראו ההערה ב-`FADE_H` */
  fade: { position: 'absolute', top: -FADE_H, right: 0, left: 0, height: FADE_H },
  name: { fontWeight: '600', color: INK, lineHeight: 17, textAlign: 'center' },
  desc: { fontWeight: '400', color: INK_SOFT, textAlign: 'center' },
  price: { marginTop: 3, fontWeight: '600', color: INK, textAlign: 'center' },
  badge: {
    marginTop: 3,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  /* ⚠ הוגדל מ-10 · בקשת שקד ״להגדיל את המחירים״ */
  badgeText: { fontSize: 12.5, fontWeight: '700', color: INK },
  /* ⚠ הפינה השמאלית · בקנבס `left: 9`, וב-RTL זו הפינה הרחוקה מהטקסט */
  tick: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: TICK,
    height: TICK,
    borderRadius: TICK / 2,
    backgroundColor: MARK,
    boxShadow: '0 2px 8px -2px rgba(122,61,24,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

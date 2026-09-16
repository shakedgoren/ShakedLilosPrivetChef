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

/* גובה הכרטיס · `cardH` בקנבס */
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
const INK = '#5E2E12';
const INK_SOFT = '#6B3F22';
const MARK = '#A85A28';

/* עיגול הסימון · 26 בקנבס, והוי בתוכו 14 בעובי 3 */
const TICK = 26;
const TICK_GLYPH = 14;
const TICK_STROKE = 3;

/** המילה שבה הקנבס חותך את התיאור · מה שאחריה הוא המחיר */
const PRICE_AT = 'תוספת';

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
      style={[s.card, { height: CARD_H[k], borderColor: on ? SEL_BD : IDLE_BD }]}
    >
      {/* ⚠ `zoom={false}` · הלחיצה חייבת לבחור את השדרוג, לא להגדיל */}
      <Photo name={extraPhoto(name)} rgb={hues.chef.rgb} zoom={false} style={s.shot} />

      <View style={s.veil}>
        {/* המדרג · ל-React Native אין linear-gradient בסגנון, ולכן SVG */}
        <Svg style={[s.fade, NO_TOUCH]} width="100%" height="100%">
          <Defs>
            <LinearGradient id="extraFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={SAND} stopOpacity={0} />
              <Stop offset="22%" stopColor={SAND} stopOpacity={0.55} />
              <Stop offset="54%" stopColor={SAND} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={SAND} stopOpacity={0.96} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#extraFade)" />
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
              {badge}
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
  veil: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    paddingTop: 26,
    paddingHorizontal: 10,
    paddingBottom: 11,
    alignItems: 'center',
    gap: 3,
  },
  fade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  name: { fontWeight: '600', color: INK, lineHeight: 17, textAlign: 'center' },
  desc: { fontWeight: '400', color: INK_SOFT, textAlign: 'center' },
  price: { marginTop: 3, fontWeight: '600', color: INK, textAlign: 'center' },
  badge: {
    marginTop: 2,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: INK },
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

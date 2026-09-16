import React, { useRef, useState } from 'react';
import { S } from './Sym';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Photo } from './Photo';
import { IS_RTL } from '../theme/rtl';
import { radius } from '../theme/tokens';
import { PhotoCaption } from './PhotoCaption';
import { photoTitle } from '../data/photoTitles';

type Props = {
  names: readonly string[];
  /** גובה האריח · מתעלמים ממנו כשיש `ratio` */
  height: number;
  /**
   * יחס רוחב לגובה · כשמוגדר, הגובה נגזר מהרוחב הנמדד במקום
   * מהמספר הקבוע. שקד ביקשה (16 בספטמבר 2026) שקרוסלת פינת השף
   * תהיה ביחס 300×200, ויחס נשמר בכל רוחב מסך — גם באייפד —
   * בעוד שגובה קבוע נשבר.
   */
  ratio?: number;
  /** רוחב אריח · בלי זה כל תמונה ממלאת את הרוחב */
  tileWidth?: number;
  rgb?: string;
  /**
   * כמה פיקסלים תופסים הריפודים משני הצדדים עד לקרוסלה.
   * ⚠ נחוץ · onLayout על העוטף מחזיר כאן 0, ו-Photo עוטפת את
   * התמונה ב-Pressable בשביל ההגדלה — עטיפה בלי רוחב מתכווצת
   * לאפס והקרוסלה נעלמת. הרוחב נגזר מרוחב המסך פחות הריפודים.
   */
  inset?: number;
};

/* מעל הסף הזה הנקודות נעשות עמוסות · מחליקים בלעדיהן */
const MAX_DOTS = 6;
/* המרווח בין אריחים · חייב להתאים ל-s.gap */
const TILE_GAP = 10;
/* הכיתוב על התמונה · האריח כאן רחב, ולכן גדול יותר מברצועה */
const CAPTION = 15;

/**
 * חצי הניווט · המידות מהקרוסלה של מפות ההגעה בקנבס — עיגול 30
 * וחץ 15 בעובי 2.4.
 * ⚠ הכיוון שונה מהקנבס · שם החצים מצביעים פנימה, ושקד ביקשה
 * שיצביעו החוצה — ימינה בצד ימין ושמאלה בצד שמאל.
 * ⚠ **אינם מהקנבס** · שקד ביקשה כפתורים מרחפים שקופים למחצה
 * שעובדים תמיד בשני הכיוונים. לכן הרקע 0.55 ולא 0.92, שני החצים
 * תמיד פעילים, והם מקיפים מהסוף להתחלה ובחזרה.
 */
const ARROW = 30;
const ARROW_GLYPH = 15;
const ARROW_STROKE = 2.4;

/**
 * סימן ההיסט האופקי בגלילה · **שונה בין הפלטפורמות**.
 *
 * ⚠ **תוקן ב-16 בספטמבר 2026** · כאן היה `IS_RTL ? -1 : 1`, כלומר
 * שלילי בכל מקום תחת RTL. זה נכון ל-`react-native-web` בלבד. במכשיר
 * ההיסט **חיובי** — נמדד בסימולטור עם מד על המסך בקרוסלת פינת השף:
 * `x=352 w=352`, אחרי החלקה אחת מהתמונה הראשונה.
 *
 * מה זה שבר: כל `scrollTo` עם ערך שלילי נחתך לאפס במכשיר. לכן
 * ההצבה ההתחלתית של הקרוסלה המעגלית נחתה על השכפול במקום על
 * התמונה האמיתית, והקפיצה השקטה בקצה לא עבדה כלל — כלומר
 * **הקרוסלה נשארה לא מעגלית**, בדיוק כפי ששקד דיווחה פעם שנייה.
 */
const DIR = Platform.OS === 'web' && IS_RTL ? -1 : 1;

/** קרוסלת תמונות אופקית · בית, שף וטאבון */
export function PhotoStrip({ names, height, ratio, tileWidth, rgb, inset = 0 }: Props) {
  const [i, setI] = useState(0);
  /**
   * ⚠ המראה של האינדקס · לחיצות רצופות על החץ קראו את `i` מתוך
   * ה-closure של הרינדור הקודם, ולכן שתי לחיצות מהירות זו אחר זו
   * קפצו לאותה תמונה. נמדד בדפדפן. הצעד נגזר מכאן ולא מ-`i`.
   */
  const iRef = useRef(0);
  const [pageW, setPageW] = useState(0);
  const strip = useRef<ScrollView>(null);
  const win = useWindowDimensions();

  const paging = tileWidth == null;
  /**
   * ⚠ **קרוסלה מעגלית · 16 בספטמבר 2026** · שקד דיווחה ש״הקרוסלה
   * בפינת השף לא מעגלית״. החצים כן עברו במעגל (`jump` עושה modulo),
   * אבל **האצבע לא** — `ScrollView` נעצר בתמונה האחרונה, ואי אפשר
   * היה להחליק ממנה לראשונה.
   *
   * הפתרון הוא שכפול קצוות: לפני הראשונה נשתלת האחרונה, ואחרי
   * האחרונה נשתלת הראשונה. כשנוחתים על אחת המשוכפלות קופצים בשקט
   * (`animated: false`) אל האמיתית שמקבילה לה, וזה בלתי נראה כי
   * התמונה זהה.
   *
   * ⚠ רק במצב דפים · ברצועות עם `tileWidth` רואים כמה אריחים יחד,
   * ושכפול היה נראה על המסך.
   */
  const loop = paging && names.length > 1;

  /**
   * מציבים את הגלילה על התמונה האמיתית הראשונה, אחרי שהרוחב נמדד.
   * ⚠ **לפני ה-`return` המוקדם** · הוק אחרי `return` מותנה משנה את
   * סדר ההוקים בין רינדורים, וריאקט קורס ברגע שהרשימה מתמלאת.
   */
  React.useEffect(() => {
    if (!loop || !pageW) return;
    strip.current?.scrollTo({ x: DIR * (iRef.current + 1) * pageW, animated: false });
  }, [loop, pageW]);

  if (names.length === 0) return null;

  const slides = loop ? [names[names.length - 1], ...names, names[0]] : names;
  /** מאיזה מקום בגלילה מתחיל האינדקס האמיתי */
  const offset = loop ? 1 : 0;
  /* המדידה גוברת כשהיא מגיעה · אחרת רוחב המסך פחות הריפודים */
  const shotW = tileWidth ?? (pageW || Math.max(0, win.width - inset));
  /* מרווח בין מרכזי אריחים · זהה לחישוב ב-onMomentumScrollEnd */
  const pitch = tileWidth ? tileWidth + TILE_GAP : pageW;
  /* הגובה · מהיחס כשיש, אחרת המספר הקבוע */
  const shotH = ratio && shotW > 0 ? Math.round(shotW / ratio) : height;


  /* לחיצה על נקודה או על חץ מגלגלת לתמונה · בלי זה המחוון זז והתמונה נשארת */
  const jump = (k: number) => {
    /* ⚠ מחזורי · חיתוך ל-[0, last] השאיר את החץ בקצה מחוסר תועלת,
       ושקד ביקשה ששני הכיוונים יעבדו תמיד */
    const next = ((k % names.length) + names.length) % names.length;
    iRef.current = next;
    setI(next);
    /* ⚠ בלי animated · גלילה חלקה אל היסט שלילי ב-RTL נחסמת בדפדפן
       והמסלול נשאר במקום. השמה ישירה עובדת, ונמדדה. */
    if (pitch) strip.current?.scrollTo({ x: DIR * (next + offset) * pitch, animated: false });
  };

  return (
    /**
     * ⚠ הרוחב חייב להימדד כאן · Photo עוטפת את התמונה ב-Pressable
     * בשביל ההגדלה, ועטיפה בלי מידות מתכווצת לאפס. כשהמדידה על
     * ה-ScrollView או על גודל התוכן נוצר מעגל — הרוחב תלוי בילדים
     * והילדים תלויים ברוחב — והקרוסלה קרסה.
     */
    <View onLayout={(e) => setPageW(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={strip}
        horizontal
        pagingEnabled={paging}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={tileWidth ? tileWidth + TILE_GAP : undefined}
        contentContainerStyle={tileWidth ? s.gap : undefined}
        onMomentumScrollEnd={(e) => {
          const w = tileWidth ? tileWidth + TILE_GAP : e.nativeEvent.layoutMeasurement.width;
          if (!w) return;
          /* ⚠ ב-RTL ההיסט יוצא שלילי · בלי abs האינדקס נחתך ל-0 */
          const k = Math.round(Math.abs(e.nativeEvent.contentOffset.x) / w);
          if (!loop) {
            iRef.current = k;
            setI(k);
            return;
          }
          /* נחתנו על משוכפלת · קופצים בשקט אל האמיתית המקבילה */
          const last = names.length;
          const real = k === 0 ? last - 1 : k === last + 1 ? 0 : k - 1;
          if (k === 0 || k === last + 1) {
            strip.current?.scrollTo({ x: DIR * (real + 1) * w, animated: false });
          }
          iRef.current = real;
          setI(real);
        }}
      >
        {slides.map((name, k) => (
          /**
           * ⚠ `zoom={false}` · שקד ביקשה שבקרוסלת פינת השף לא תהיה
           * הגדלה בלחיצה, ושהשם יופיע על התמונה עצמה במקום.
           */
          /* ⚠ `overflow: hidden` ופינה · בלעדיהם המסגרת עוגלה
             והתמונה עצמה נשארה מרובעת בפינות
             ⚠ המפתח לפי המיקום ולא לפי השם · במצב מעגלי יש שמות כפולים */
          <View key={`${k}-${name}`} style={[s.tile, { width: shotW }]}>
            <Photo
              name={name}
              rgb={rgb}
              zoom={false}
              style={[s.shot, { height: shotH, width: shotW, borderRadius: radius.tile }]}
            />
            {/* ⚠ הכיתוב בראש התמונה · בקשה של שקד */}
            <PhotoCaption text={photoTitle(name)} size={CAPTION} align="top" />
          </View>
        ))}
      </ScrollView>

      {/* החצים · בלעדיהם לא היה מובן שיש עוד תמונות בקרוסלה */}
      {names.length > 1 ? (
        <>
          <Pressable
            onPress={() => jump(iRef.current - 1)}
            style={[s.arrow, ARROW_BLUR, s.arrowRight, { top: shotH / 2 - ARROW / 2 }]}
            hitSlop={6}
          >
            <S k="chevronRight" size={ARROW_GLYPH} color={ARROW_INK} />
          </Pressable>
          <Pressable
            onPress={() => jump(iRef.current + 1)}
            style={[s.arrow, ARROW_BLUR, s.arrowLeft, { top: shotH / 2 - ARROW / 2 }]}
            hitSlop={6}
          >
            <S k="chevronLeft" size={ARROW_GLYPH} color={ARROW_INK} />
          </Pressable>
        </>
      ) : null}

      {paging && names.length > 1 && names.length <= MAX_DOTS ? (
        <View style={s.dots}>
          {names.map((name, k) => (
            <Pressable
              key={name}
              onPress={() => jump(k)}
              style={[s.dot, { width: k === i ? 16 : 5, opacity: k === i ? 1 : 0.35 }]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** גוון החץ · הכתום הכהה של השף, כמו בקנבס */
const ARROW_INK = '#7A3D18';
/**
 * ⚠ **ליקוויד גלאס** · בקשה של שקד. בקנבס הכפתור אטום (0.92),
 * וכאן הוא זכוכית: מילוי לבן דליל, שפה לבנה פנימית, צל רך —
 * ומעליהם טשטוש של מה שמאחור.
 * ⚠ ל-React Native אין `backdrop-filter` · ההשמה נוחתת ב-CSS
 * ב-React Native Web. במכשיר יישארו המילוי, השפה והצל.
 */
const ARROW_BG = 'rgba(255,255,255,0.42)';
const ARROW_GLASS =
  'inset 0 0 0 1px rgba(255,255,255,0.65)' +
  ', inset 0 1.5px 0 rgba(255,255,255,0.92)' +
  ', 0 6px 16px -6px rgba(20,16,12,0.5)';
const ARROW_BLUR = {
  backdropFilter: 'blur(12px) saturate(160%)',
  WebkitBackdropFilter: 'blur(12px) saturate(160%)',
} as unknown as ViewStyle;

const s = StyleSheet.create({
  gap: { gap: TILE_GAP },
  tile: { borderRadius: radius.tile, overflow: 'hidden' },
  arrow: {
    position: 'absolute',
    width: ARROW,
    height: ARROW,
    borderRadius: ARROW / 2,
    backgroundColor: ARROW_BG,
    boxShadow: ARROW_GLASS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRight: { right: 8 },
  arrowLeft: { left: 8 },
  shot: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { height: 5, borderRadius: 999, backgroundColor: '#A85A28' },
});

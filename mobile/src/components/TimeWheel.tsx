import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { a, surface } from '../theme/tokens';
import { NO_TOUCH } from '../theme/pointerEvents';
import { hhmm, toMinutes } from '../order/types';

/**
 * בורר שעה בגלגל · שקד ביקשה (16 בספטמבר 2026) ״שיהיה כמו השעון
 * המעורר באייפון, שניתן להזיז את השעה עם האצבע להעלות ולהוריד״.
 *
 * ⚠ **שני `ScrollView` ולא רכיב מערכת** · ל-iOS יש `DatePicker`
 * ילידי, אבל הוא מגיע עם הצבעים והגופן של המערכת ולא של האפליקציה,
 * ובאנדרואיד ובדפדפן הוא נראה אחרת לגמרי. שתי עמודות שנגללות
 * ונתפסות למשבצת נותנות בדיוק את אותה תחושה, באותו גוון ובאותו
 * גופן, ובשלוש הפלטפורמות.
 *
 * ⚠ **הטווח נחתך לחלון האיסוף** · שעה שמחוץ לחלון פשוט לא קיימת
 * בגלגל, ולכן אי אפשר לבחור אותה מלכתחילה. קודם זה היה שדה טקסט
 * חופשי שנתפס פנימה רק ביציאה ממנו.
 *
 * ⚠⚠ **הגלגל הראה שעה אחת והחזיק אחרת · תוקן ב-11 באוקטובר 2026** ·
 * שקד דיווחה ״שעות איסוף חורגות מהמותר״, ובפירוט: ״השעות של
 * הקוסקוס הם 11:30-14:30 אבל זה מראה גם 11:00 ו-14:45״. הרשימות
 * עצמן היו תקינות כל הזמן — ‎11:00 ו-14:45 אינן קיימות בהן כלל.
 * מה שהיה שבור הוא **מיקום הגלילה**: העמודה נפתחה תמיד על
 * ההיסט 0, כלומר על הפריט הראשון, בלי קשר לערך שהיא קיבלה.
 * נמדד על הבנייה האמיתית ברוחב טלפון: גלגל עם הערך ‎12:00 הציג
 * ‎11:00, וגלגל עם הערך ‎14:30 הציג גם הוא ‎11:00. מכאן שתי
 * התלונות: הפס המודגש יושב על ‎11:00 בפתיחה, וכשמזיזים אחרי זה
 * רק עמודה אחת, העמודה השנייה נשארת על מה שהיא הראתה — למשל
 * ‎45 מרשימת שעה אחרת — והקריאה יוצאת ‎14:45.
 *
 * ⚠⚠⚠ **ובדפדפן הגלגל כלל לא דיווח · אותו יום** · זה החלק הגדול
 * יותר, והוא התגלה רק בהנעה אמיתית של הגלגל בבנייה הבנויה:
 * `react-native-web` מממש ב-`ScrollView` **אך ורק** `onScroll`.
 * `onMomentumScrollEnd` ו-`onScrollEndDrag` — שני המאזינים שעליהם
 * נשען `settle` — נשפכים ל-`rest` ומועברים ל-`View`, כלומר נבלעים
 * בשקט (ראו `node_modules/react-native-web/dist/exports/ScrollView/
 * ScrollViewBase.js`). לכן בדפדפן הגלילה הזיזה את המספרים על המסך
 * והערך **לא השתנה אף פעם**. נמדד: הזזת הגלגל ל-14:45 בזמן
 * שהערך נשאר ‎12:00. זה בדיוק הפער שהיא ראתה.
 *
 * ⚠ **למה `onScroll` ולא תיקון ב-`settle`** · RNW שולח `onScroll`
 * נוסף כמאה מילישניות אחרי שהגלילה נעצרה, ולכן המתנה קצרה
 * לשקט היא זיהוי עצירה אמין בדפדפן. במכשיר **לא** נוגעים
 * במסלול הקיים: שם שני המאזינים המקוריים עובדים ומדויקים יותר,
 * והמתנה לשקט הייתה מיישרת את הגלגל באמצע גרירה איטית.
 *
 * שלושת התיקונים הנוספים, וכולם על אותה מחלה — ה-DOM לא עקב אחרי הערך:
 * · `at` מתחיל ב-‎1- ולכן האפקט *כן* רץ בהרכבה ומציב את הפס על
 *   הערך שהתקבל, במקום לחשוב שהוא כבר שם.
 * · החלפת רשימה (שעה שבה יש פחות דקות) מציבה מחדש, כי אותו היסט
 *   מצביע עכשיו על מספר אחר.
 * · `settle` שקרה בזמן גלילת תיקון כבר לא נזרק לפח. קודם הוא
 *   יצא מוקדם, והגלגל נשאר במקום שהאצבע השאירה בלי שהערך ידע.
 */

/** גובה משבצת אחת · שלוש נראות בכל רגע */
const ITEM_H = 44;
const VISIBLE = 3;
const PAD = (ITEM_H * (VISIBLE - 1)) / 2;
/** הריפוד של הקופסה · הפס המודגש חייב להיסגר עליו כדי לשבת על השורה */
const BOX_PAD = 10;
/** קפיצות הדקות · רבע שעה, כמו בחלון איסוף */
const STEP_MIN = 15;
/**
 * ⚠ **רוחב הקופסה · צומצם ב-17 בספטמבר 2026** · בקשה של שקד:
 * ״שהרוחב של זה יהיה צר יותר״. הקופסה נמתחה לכל רוחב החלונית,
 * ושתי עמודות ספרות באמצע נראו אבודות בתוכה.
 */
const BOX_W = 176;
/** משך גלילת התיקון · ראו `settling` */
const SNAP_MS = 260;
/**
 * כמה שקט נחשב ״הגלגל נעצר״ · בדפדפן בלבד.
 * ⚠ גדול מ-100 של RNW · אחרת ההודעה האחרונה שלו פותחת סיבוב נוסף
 */
const IDLE_MS = 140;

type Props = {
  /** ״HH:MM״ */
  value: string;
  onChange: (next: string) => void;
  /** גבולות החלון · בדקות מחצות */
  from: number;
  to: number;
  accent: { hue: string; deep: string; rgb: string };
};

/** עמודה אחת · נגללת, נתפסת, ומדווחת מה נחת במרכז */
function Column({
  values,
  value,
  onChange,
  accent,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  accent: Props['accent'];
}) {
  const ref = React.useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(value));

  /**
   * ⚠ **המספרים רצו בלי הפסקה · תוקן ב-17 בספטמבר 2026** · שקד
   * דיווחה: ״כשאני מחליקה עם האצבע לבחירת שעה יש באג המספרים לא
   * מפסיקים לרוץ ללא הפסקה״.
   *
   * הסיבה היא **לולאה בין שתי גלילות**: `settle` קרא ל-`onChange`
   * **וגם** ל-`scrollTo` מונפש. ה-`onChange` שינה את הערך למעלה,
   * האפקט שלמטה גלל שוב, והגלילה המונפשת סיימה ופתחה `settle`
   * נוסף — וחוזר חלילה.
   *
   * `at` זוכר על איזו משבצת הגלגל **באמת** נמצא, ולכן האפקט אינו
   * מתקן גלילה שהגיעה מהגלגל עצמו. `settling` חוסם `settle` בזמן
   * גלילת התיקון.
   */
  /**
   * ⚠ **‎1- ולא `index`** · ראו את ההסבר בראש הקובץ. כשזה התחיל
   * מ-`index`, האפקט ראה ״אני כבר שם״ ולא גלל — אבל הגלגל עצמו
   * היה על ההיסט 0, כלומר על הפריט הראשון.
   */
  const at = React.useRef(-1);
  const settling = React.useRef(false);

  /** מי שבאמת נבחר · נקרא מתוך `onContentSizeChange` */
  const want = React.useRef(index);
  want.current = index;

  /** זהות הרשימה · רשימה שהתחלפה משנה את מה שההיסט מצביע עליו */
  const key = values.join(',');
  const lastKey = React.useRef(key);

  const place = React.useCallback((i: number) => {
    at.current = i;
    ref.current?.scrollTo({ y: i * ITEM_H, animated: false });
  }, []);

  React.useEffect(() => {
    const swapped = lastKey.current !== key;
    lastKey.current = key;
    /* ⚠ גלילה שהגיעה מהגלגל עצמו אינה מתוקנת · זו הלולאה של 17.9 */
    if (!swapped && at.current === index) return;
    place(index);
  }, [index, key, place]);

  const settle = (y: number) => {
    const i = Math.min(values.length - 1, Math.max(0, Math.round(y / ITEM_H)));
    at.current = i;

    /* ⚠ מיישרים רק כשבאמת נעצרנו בין משבצות · `snapToInterval`
       כבר עושה את רוב העבודה, וגלילה מיותרת היא זו שפתחה לולאה.
       ⚠ בזמן גלילת תיקון מדלגים על **הגלילה בלבד** · הערך עצמו
       נמסר תמיד, אחרת הגלגל והערך נפרדים ואין מי שיחזיר אותם */
    if (!settling.current && Math.abs(y - i * ITEM_H) > 1) {
      settling.current = true;
      ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
      setTimeout(() => {
        settling.current = false;
      }, SNAP_MS);
    }

    if (values[i] !== value) onChange(values[i]);
  };

  /* ⚠ זיהוי עצירה בדפדפן · ראו ההסבר בראש הקובץ */
  const idle = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (idle.current) clearTimeout(idle.current);
  }, []);

  const watchWeb = (y: number) => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => settle(y), IDLE_MS);
  };

  return (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      style={s.col}
      contentContainerStyle={{ paddingVertical: PAD }}
      scrollEventThrottle={16}
      onScroll={
        Platform.OS === 'web' ? (e) => watchWeb(e.nativeEvent.contentOffset.y) : undefined
      }
      /* ⚠ הגלילה הראשונה רצה לפני שלתוכן יש גובה · בלי ההצבה
         הזאת היא פשוט אינה תופסת, והגלגל נשאר על הפריט הראשון */
      onContentSizeChange={() => place(want.current)}
      onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
      /* ⚠ גרירה איטית אינה מייצרת `momentum` · בלי זה היא נתקעת באמצע */
      onScrollEndDrag={(e) => settle(e.nativeEvent.contentOffset.y)}
    >
      {values.map((v) => {
        const on = v === value;
        return (
          <View key={v} style={s.item}>
            <Text style={[s.num, on ? { color: accent.deep } : s.numOff]}>
              {String(v).padStart(2, '0')}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

/** הדקות שאפשריות בשעה נתונה · השעה הראשונה והאחרונה חתוכות */
function minutesIn(h: number, from: number, to: number): number[] {
  const out: number[] = [];
  for (let x = 0; x < 60; x += STEP_MIN) {
    const t = h * 60 + x;
    if (t >= from && t <= to) out.push(x);
  }
  return out;
}

/**
 * השעה הקרובה ביותר שהגלגל **יודע להציג**.
 *
 * ⚠ **למה זה נחוץ · 11 באוקטובר 2026** · `clamp` של `useFulfillment`
 * דוחף לתוך החלון אבל לא לרבעי השעה, ולכן ערך כמו ‎14:20 היה נשאר
 * כערך בזמן שהגלגל מציג ‎14:15. הפס המודגש חייב להיות הערך, אחרת
 * חוזרים בדיוק לתלונה שתוקנה כאן.
 */
function onWheel(t: number, from: number, to: number): number {
  const c = Math.min(to, Math.max(from, t));
  const h = Math.floor(c / 60);
  const opts = minutesIn(h, from, to);
  if (!opts.length) return c;
  return opts
    .map((m) => h * 60 + m)
    .reduce((best, v) => (Math.abs(v - c) < Math.abs(best - c) ? v : best));
}

export function TimeWheel({ value, onChange, from, to, accent }: Props) {
  const mins = onWheel(toMinutes(value) ?? from, from, to);
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  /* ⚠ הערך שהגלגל אינו יכול להציג מדווח החוצה מיד · ראו `onWheel` */
  React.useEffect(() => {
    const fixed = hhmm(mins);
    if (fixed !== value) onChange(fixed);
  }, [mins, value, onChange]);

  /** השעות שבתוך החלון */
  const hours = React.useMemo(() => {
    const out: number[] = [];
    for (let x = Math.floor(from / 60); x <= Math.floor(to / 60); x += 1) out.push(x);
    return out;
  }, [from, to]);

  const minutes = React.useMemo(() => {
    const out = minutesIn(h, from, to);
    return out.length ? out : [0];
  }, [h, from, to]);

  const set = (nh: number, nm: number) => {
    const t = onWheel(nh * 60 + nm, from, to);
    onChange(hhmm(t));
  };

  return (
    <View style={[s.box, { backgroundColor: a(accent.rgb, 0.08), borderColor: a(accent.rgb, 0.24) }]}>
      {/* המשבצת הנבחרת · פס מודגש מאחורי השורה האמצעית */}
      <View
        style={[s.band, NO_TOUCH, { backgroundColor: a(accent.rgb, 0.16), top: BOX_PAD + PAD }]}
      />

      {/* ⚠ הסדר הוא שעות ואז נקודתיים ואז דקות · תחת RTL השורה
          מתהפכת, ולכן `row-reverse` שומר על הקריאה הרגילה של שעון */}
      <View style={s.row}>
        <Column values={hours} value={h} onChange={(nh) => set(nh, m)} accent={accent} />
        <Text style={[s.colon, { color: accent.deep }]}>:</Text>
        <Column values={minutes} value={m} onChange={(nm) => set(h, nm)} accent={accent} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    width: BOX_W,
    alignSelf: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    paddingVertical: BOX_PAD,
    alignItems: 'center',
    overflow: 'hidden',
  },
  band: { position: 'absolute', left: 0, right: 0, height: ITEM_H, borderRadius: 12 },
  /* ⚠ `row-reverse` תחת RTL · כך השעות נשארות בצד ימין של הנקודתיים */
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  col: { height: ITEM_H * VISIBLE, width: 62 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  numOff: { color: surface.faint },
  colon: { fontSize: 24, fontWeight: '600', marginTop: -2 },
});

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
 */

/** גובה משבצת אחת · שלוש נראות בכל רגע */
const ITEM_H = 44;
const VISIBLE = 3;
const PAD = (ITEM_H * (VISIBLE - 1)) / 2;
/** הריפוד של הקופסה · הפס המודגש חייב להיסגר עליו כדי לשבת על השורה */
const BOX_PAD = 10;
/** קפיצות הדקות · רבע שעה, כמו בחלון איסוף */
const STEP_MIN = 15;

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

  /* מציבים את הגלגל על הערך הנוכחי · גם בפתיחה וגם כשהוא משתנה מבחוץ */
  React.useEffect(() => {
    ref.current?.scrollTo({ y: index * ITEM_H, animated: false });
  }, [index]);

  const settle = (y: number) => {
    const i = Math.min(values.length - 1, Math.max(0, Math.round(y / ITEM_H)));
    if (values[i] !== value) onChange(values[i]);
    /* ⚠ מיישרים בכוח · גלילה קצרה נעצרת בין משבצות */
    ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
  };

  return (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      style={s.col}
      contentContainerStyle={{ paddingVertical: PAD }}
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

export function TimeWheel({ value, onChange, from, to, accent }: Props) {
  const mins = toMinutes(value) ?? from;
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  /** השעות שבתוך החלון */
  const hours = React.useMemo(() => {
    const out: number[] = [];
    for (let x = Math.floor(from / 60); x <= Math.floor(to / 60); x += 1) out.push(x);
    return out;
  }, [from, to]);

  /** הדקות שאפשריות בשעה הנוכחית · השעה הראשונה והאחרונה חתוכות */
  const minutes = React.useMemo(() => {
    const out: number[] = [];
    for (let x = 0; x < 60; x += STEP_MIN) {
      const t = h * 60 + x;
      if (t >= from && t <= to) out.push(x);
    }
    return out.length ? out : [0];
  }, [h, from, to]);

  const set = (nh: number, nm: number) => {
    const t = Math.min(to, Math.max(from, nh * 60 + nm));
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

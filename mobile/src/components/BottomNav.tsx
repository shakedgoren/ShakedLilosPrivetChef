import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { stopOf, type } from '../theme/tokens';
import { INDIGO_70, S, type SYM } from './Sym';
import { useNav } from '../navigation/store';
import { IS_RTL } from '../theme/rtl';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * סרגל הניווט התחתון · מופיע אך ורק כשהמשתמשת מחוברת,
 * בדיוק כמו בקנבס. כשלא מחוברים הוא לא מרונדר בכלל.
 *
 * ⚠ **עיצוב המגרעת · 16 בספטמבר 2026** · שקד שלחה תמונת ייחוס
 * וביקשה ״לשנות את העיצוב של הנאב בר להיות כמו שהוא נראה בתמונה,
 * באותו הצבע שהוא עכשיו לבן וסגול אבל בעיצוב הזה״.
 *
 * הסימן ההיכר של העיצוב הזה: **האייקון הפעיל יוצא מהסרגל אל עיגול
 * מרחף**, ושפת הסרגל מתעגלת סביבו בחיבור רך משני הצדדים. הכיתוב
 * הפעיל נשאר בתוך הסרגל, מתחת לעיגול.
 *
 * ⚠ **הכול צורה אחת** · הסרגל, שני החיבורים והעיגול מצוירים
 * כ-`Path` יחיד ב-SVG. אילו העיגול היה `View` נפרד היה נשאר קו
 * תפר בין שני המילויים, ובזכוכית חצי־שקופה הוא נראה מיד.
 */
const TABS = [
  { key: 'main', label: 'בית', sym: 'home' },
  { key: 'orders', label: 'הזמנות', sym: 'orders' },
  { key: 'profile', label: 'אזור אישי', sym: 'personalArea' },
] as const satisfies readonly { key: string; label: string; sym: keyof typeof SYM }[];

/**
 * המרווח שמסך עם שורה תחתונה חייב להשאיר לנאב-בר.
 * מהקנבס (`Order.dc.html`): הנאב יושב ב-`bottom: 26` בגובה 68,
 * ושורת הסה״כ יושבת ב-`bottom: 102` — שמונה פיקסלים מעליו.
 * ⚠ בלי זה הנאב עולה על שורת הסה״כ ועל כפתור ההמשך, ואי אפשר
 * ללחוץ עליו. שקד דיווחה על זה ב-14 בספטמבר.
 */
export const BAR_BOTTOM_WITH_NAV = 102;

/**
 * ריפוד תחתון לאזור גלילה שממשיך עד תחתית המסך.
 * ⚠ בלי זה התוכן האחרון נחתך מתחת לנאב-בר ואי אפשר ללחוץ עליו.
 */
export const SCROLL_PAD_NAV = BAR_BOTTOM_WITH_NAV;

/* ---------- מידות הצורה ---------- */
/** גובה הסרגל עצמו */
const H = 64;
/** המקום שמעליו · שם מרחף העיגול הפעיל */
const TOP = 42;
/** פינת הסרגל */
const R = 26;
/** רדיוס העיגול הפעיל */
const KR = 25;
/**
 * כמה מרכז העיגול גבוה משפת הסרגל.
 * ⚠ **חייב להיות קטן מ-`KR`** · אחרת אין חיתוך בין העיגול לשפה
 * ואי אפשר לחשב חיבור משיק — השורש יוצא שלילי.
 */
const KNOB_DY = 13;
/** רדיוס החיבור הרך בין השפה לעיגול */
const F = 13;

/* צבעי הלשונית · מהקנבס · הפעילה סגולה ועבה יותר */
const ON_INK = '#7B5CBC';
const OFF_INK = '#918A9E';
const EDGE = 'rgba(255,255,255,0.9)';
/**
 * ⚠ **אטום יותר מזכוכית הקנבס** · `NAV_STOPS` הם 0.66→0.44, וזה
 * מתאים לרקע הבהיר של האפליקציה. הנאב-בר מרחף מעל **רצועת התמונות**
 * בדף הבית, ושם הוא פשוט נעלם — נמדד בדפדפן. הגוונים כאן שומרים על
 * תחושת הזכוכית אבל נותנים לצורה להיקרא.
 */
const FILL_STOPS = ['rgba(255,255,255,0.93)', 'rgba(255,255,255,0.82)'] as const;

/**
 * מסלול הסרגל עם המגרעת.
 *
 * החישוב: מעגל החיבור ברדיוס `F` משיק לשפה הישרה מלמטה (מרכזו
 * ב-`y = F`) ומשיק חיצונית לעיגול הפעיל (מרחק המרכזים `KR + F`).
 * מכאן ההיסט האופקי שלו, ומכאן נקודת ההשקה על העיגול.
 */
/** סרגל חלק · בלי מגרעת, כשאין לשונית פעילה */
function plainPath(w: number): string {
  const top = TOP;
  const bottom = TOP + H;
  return [
    `M ${R} ${top}`,
    `L ${w - R} ${top}`,
    `A ${R} ${R} 0 0 1 ${w} ${top + R}`,
    `L ${w} ${bottom - R}`,
    `A ${R} ${R} 0 0 1 ${w - R} ${bottom}`,
    `L ${R} ${bottom}`,
    `A ${R} ${R} 0 0 1 0 ${bottom - R}`,
    `L 0 ${top + R}`,
    `A ${R} ${R} 0 0 1 ${R} ${top}`,
    'Z',
  ].join(' ');
}

function navPath(w: number, cx: number): string {
  const top = TOP;
  const bottom = TOP + H;
  const ky = TOP - KNOB_DY;

  /* ההיסט האופקי של מרכז החיבור · פיתגורס על משולש המרכזים */
  const span = Math.sqrt(Math.max(0, (KR + F) ** 2 - (F + KNOB_DY) ** 2));
  const fl = cx - span;
  const fr = cx + span;

  /* נקודת ההשקה על העיגול · על הישר שבין מרכז החיבור למרכז העיגול */
  const t = F / (F + KR);
  const tlx = fl + (cx - fl) * t;
  const tly = top + F + (ky - (top + F)) * t;
  const trx = fr + (cx - fr) * t;

  return [
    `M ${R} ${top}`,
    `L ${fl} ${top}`,
    /* חיבור שמאלי · עולה מהשפה אל העיגול */
    `A ${F} ${F} 0 0 1 ${tlx} ${tly}`,
    /* מעל העיגול · הדרך הארוכה, ולכן large-arc */
    `A ${KR} ${KR} 0 1 1 ${trx} ${tly}`,
    /* חיבור ימני · יורד בחזרה אל השפה */
    `A ${F} ${F} 0 0 1 ${fr} ${top}`,
    `L ${w - R} ${top}`,
    `A ${R} ${R} 0 0 1 ${w} ${top + R}`,
    `L ${w} ${bottom - R}`,
    `A ${R} ${R} 0 0 1 ${w - R} ${bottom}`,
    `L ${R} ${bottom}`,
    `A ${R} ${R} 0 0 1 0 ${bottom - R}`,
    `L 0 ${top + R}`,
    `A ${R} ${R} 0 0 1 ${R} ${top}`,
    'Z',
  ].join(' ');
}

export function BottomNav() {
  const { screen, loggedIn, go } = useNav();
  const [w, setW] = React.useState(0);
  if (!loggedIn) return null;

  /**
   * ⚠ **`-1` כשאף לשונית אינה פעילה** · במסכי הקטגוריות וההזמנה
   * אין לשונית מתאימה, ואז **אין מגרעת** והסרגל חלק. קודם החישוב
   * נחתך ל-0 והעיגול ריחף מתחת ל״בית״ גם כשלא היינו שם — ובמסכים
   * עם שורת סיכום תחתונה הוא גם היה נוגע בה.
   */
  const active = TABS.findIndex((t) => t.key === screen);
  /**
   * ⚠ **המשבצת נספרת מימין תחת RTL** · הלשונית הראשונה נוחתת בצד
   * ימין, ולכן חישוב מהשמאל שם את המגרעת מתחת ללשונית הלא נכונה.
   * נמדד בדפדפן: ״בית״ בימין והמגרעת בשמאל.
   */
  const slot = IS_RTL ? TABS.length - 1 - active : active;
  const cx = w > 0 ? (w * (slot + 0.5)) / TABS.length : 0;

  return (
    <View style={s.wrap} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <Svg width={w} height={TOP + H} style={[s.shape, NO_TOUCH]}>
          <Defs>
            <LinearGradient id="navGlass" x1="0" y1="0" x2="0" y2="1">
              {FILL_STOPS.map((c, i) => (
                <Stop key={c} offset={i} {...stopOf(c)} />
              ))}
            </LinearGradient>
          </Defs>
          <Path
            d={active < 0 ? plainPath(w) : navPath(w, cx)}
            fill="url(#navGlass)"
            stroke={EDGE}
            strokeWidth={1}
          />
        </Svg>
      ) : null}

      <View style={s.row}>
        {TABS.map((t) => {
          const on = screen === t.key;
          return (
            <Pressable key={t.key} onPress={() => go(t.key)} style={s.tab}>
              {/* ⚠ מיקום מוחלט · האייקון הפעיל חייב לנחות בדיוק במרכז
                  העיגול שנחתך במסלול, והכיתוב להישאר בתוך הסרגל */}
              <View style={[s.icon, on ? s.iconUp : s.iconRest]}>
                <S k={t.sym} size={on ? 24 : 22} color={on ? ON_INK : INDIGO_70} />
              </View>
              <Text
                style={[
                  s.label,
                  on ? s.labelOn : s.labelRest,
                  { color: on ? ON_INK : OFF_INK, fontWeight: on ? '700' : '400' },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** מרכז העיגול הפעיל, במערכת של העוטף */
const KNOB_CY = TOP - KNOB_DY;

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 26,
    right: 18,
    left: 18,
    height: TOP + H,
    /* ⚠ **בלי `overflow: hidden`** · הוא היה חותך את העיגול המרחף */
  },
  shape: { position: 'absolute', top: 0, left: 0 },
  row: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row' },
  tab: { flex: 1 },
  icon: { position: 'absolute', right: 0, left: 0, alignItems: 'center' },
  /* הפעיל · במרכז העיגול המרחף */
  iconUp: { top: KNOB_CY - 12 },
  /* הרדום · בתוך הסרגל, מעל הכיתוב */
  iconRest: { top: TOP + 13 },
  label: { position: 'absolute', right: 0, left: 0, fontSize: type.tiny, textAlign: 'center' },
  labelOn: { top: TOP + 22 },
  labelRest: { top: TOP + 39 },
});

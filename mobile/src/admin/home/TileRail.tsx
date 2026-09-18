import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import Svg, { Path } from 'react-native-svg';
import { LAV, SOFT_SHADOW } from './NightSky';
import { AMBER, PLUM, STATE, TILES, type TileKey } from '../../data/adminHome';
import { FONT_BUMP } from '../../theme/fontScale';

/** ארבעה אריחים בשורה · שלושה רווחים של 10 ביניהם */
const PER_ROW = 4;
const GAP = 10;
/**
 * ⚠ **הרוחב נמדד ולא מחושב ב-CSS · תוקן ב-16 בספטמבר 2026** · כאן
 * ישב `calc((100% - 30px) / 4)`. זה עובד ב-`react-native-web` אבל
 * **מנוע הפריסה של ריאקט־נייטיב אינו מכיר `calc`**, ובמכשיר הרוחב
 * נזרק וכל אריח הצטמצם לרוחב התוכן. אותה תקלה בדיוק הייתה ב-
 * `OptionGrid` וב-`DateCalendar`.
 */
const GUESS_W = 360;
const FALLBACK_W = `${100 / PER_ROW - (GAP * (PER_ROW - 1)) / (GUESS_W / 100) / PER_ROW}%`;

/**
 * ⚠ **אילו אריחים נושאים תג · 17 בספטמבר 2026** · בקשה של שקד:
 * ״את המספר בעיגול שמופיע על תפריט ולקוחות אפשר להסיר, זה לא
 * רלוונטי, רק את המספר של המלאי להשאיר״. מספר הפריטים בתפריט ומספר
 * הלקוחות אינם דורשים פעולה — הם סתם ספירה; המלאי הנמוך כן.
 */
const WITH_BADGE: readonly TileKey[] = ['orders', 'days', 'stock', 'shop', 'costs', 'hist'];

/** התג שעל האריח · ענבר לדבר שדורש טיפול, שזיף למספר שגרתי */
const BADGES: Record<TileKey, { value: string | number; tone: typeof AMBER }> = {
  orders: { value: STATE.newOrders, tone: AMBER },
  days: { value: STATE.nextSale, tone: PLUM },
  stock: { value: STATE.lowStock, tone: AMBER },
  shop: { value: STATE.toBuy, tone: PLUM },
  people: { value: STATE.people, tone: PLUM },
  menu: { value: STATE.menuItems, tone: PLUM },
  costs: { value: STATE.costsDue ? '!' : 0, tone: AMBER },
  hist: { value: STATE.buys, tone: PLUM },
};

/**
 * אריחי הניווט · שער למסכי הניהול שאינם בנאב-בר.
 *
 * ⚠ **הרוחב נמדד ולא הוחל · תוקן ב-16 בספטמבר 2026** · שקד דיווחה
 * ״צריך לסדר את הנראות של ארבעת הקטגוריות בתחתית המסך בדף הבית״.
 * נמדד בסימולטור: ארבעת האריחים **נדחסו לחצי הימני של המסך**
 * והחצי השמאלי נשאר ריק.
 *
 * הסיבה: `tileW` חושב כאן מ-`onLayout` — ו**מעולם לא הועבר
 * לאריח**. בלי רוחב כל אריח התכווץ לרוחב התוכן שלו.
 *
 * ⚠ **שורה אחת של ארבעה** · שקד ביקשה (15 בספטמבר 2026) שבדף
 * הבית יופיעו רק תפריט · עלויות · לקוחות · מלאי. הזמנות, ימי
 * מכירה, קניות וכספים עברו לנאב-בר.
 *
 * ⚠ **היסטוריית הקניות ירדה מכאן** · היא נשארת נגישה מאייקון
 * השעון שבכותרת מסך הקניות.
 */
export function TileRail({
  onOpen,
  badges,
  keys,
}: {
  onOpen: (key: TileKey) => void;
  badges?: Record<string, number | string | boolean>;
  /** אילו אריחים להציג ובאיזה סדר · ברירת המחדל היא כל השמונה */
  keys?: TileKey[];
}) {
  const [w, setW] = React.useState(0);
  const tileW: number | string =
    w > 0 ? (w - GAP * (PER_ROW - 1)) / PER_ROW : FALLBACK_W;
  /* ⚠ הסדר הוא של `keys` ולא של `TILES` · שקד קבעה סדר משלה */
  const shown = keys ? keys.map((k) => TILES.find((t) => t.key === k)!).filter(Boolean) : TILES;
  return (
    <View style={s.grid} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {shown.map((t) => {
        const fallback = BADGES[t.key];
        const raw = badges
          ? t.key === 'costs'
            ? badges.costs
              ? '!'
              : 0
            : badges[t.key]
          : fallback.value;
        const raw2 = WITH_BADGE.includes(t.key) ? raw : 0;
        const value = raw2 === true ? '!' : raw2 === false ? 0 : (raw2 ?? fallback.value);
        const tone = fallback.tone;
        return (
          <Pressable
            key={t.key}
            onPress={() => onOpen(t.key)}
            style={[s.tile, { width: tileW as never }]}
          >
            <Svg width={21} height={21} viewBox="0 0 24 24">
              {t.paths.map((d) => (
                <Path
                  key={d}
                  d={d}
                  fill="none"
                  stroke={LAV.accent}
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
            <Text style={s.name}>{t.name}</Text>
            {value ? (
              <View style={[s.badge, { backgroundColor: tone.bg }]}>
                <Text style={[s.badgeText, { color: tone.fg }]}>{value}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ ארבעה בשורה · הרוחב אחוזי כדי שהשורה תתמלא בכל מסך */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 2 },
  tile: {
    /**
     * ⚠ **הוגדל · 17 בספטמבר 2026** · בקשה של שקד: ״להגדיל לו מעט
     * את הכרטיסייה כי הוא נחתך״. אחרי הגדלת הכתב הגלובלית שם
     * האריח והתג כבר לא נכנסו בגובה 62.
     */
    height: 62 + FONT_BUMP * 2,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    boxShadow: SOFT_SHADOW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  name: { fontSize: 12, fontWeight: '600', color: LAV.soft },
  /**
   * ⚠ **התג נכנס פנימה · 16 בספטמבר 2026** · הוא ישב בפינה
   * **החיצונית** (`top: -5, end: -4`), כמו בקנבס. נמדד בסימולטור:
   * האריח הבא בשורה נצבע **אחריו** ולכן כיסה אותו, והמספרים ״3״
   * ו״7״ יצאו חתוכים. בתוך האריח הוא נקרא במלואו תמיד.
   */
  badge: {
    position: 'absolute',
    top: 4,
    end: 4,
    /**
     * ⚠ **העיגול גדל עם הכתב · 18 בספטמבר 2026** · בקשה של שקד:
     * ״את המספר של המלאי — להגדיל לו מעט את העיגול או להקטין את
     * המספר כי הוא נחתך״.
     *
     * הסיבה: העיגול היה 19 קבוע, והכתב שבתוכו גדל ב-`FONT_BUMP`
     * יחד עם כל האפליקציה — מ-11.5 ל-15.5 נקודות. גובה 19 כבר לא
     * הכיל אותו. מרגע שהמידה **נגזרת מהתוספת** היא לא תישבר שוב
     * בשינוי הבא של גודל הכתב.
     */
    minWidth: 19 + FONT_BUMP,
    height: 19 + FONT_BUMP,
    borderRadius: 999,
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: LAV.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
});

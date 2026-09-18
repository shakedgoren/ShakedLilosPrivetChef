import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Bell } from '../icons';
import { useCheer } from './Cheer';
import { GlassFill } from './Glass';
import { CATEGORIES } from '../data/categories';
import { upcomingSale } from '../data/saleWeek';
import { a, radius, space, surface, type } from '../theme/tokens';
import { GLASS_SHADOW, GLASS_STOPS } from '../theme/glass';
import { apiEnabled } from '../api/config';
import { setReminder, useReminder } from '../order/reminders';
import {
  cancelSaleReminder,
  requestSaleReminder,
  saleDayStatus,
  type SaleState,
} from '../api/orders';

/**
 * שורת יום המכירה הקרוב · דף הבית, אחרי התחברות.
 *
 * ⚠ **נכתבה מחדש ב-16 בספטמבר 2026** · שקד דיווחה שהשורה מציגה
 * ״היום סגור להזמנות״, ואמרה: ״שלא יראה היום סגור להזמנות אלא
 * יראה את יום המכירה הקרוב״. שתי בעיות היו כאן:
 *
 * 1. **הקטגוריה הייתה מקובעת לקוסקוס.** עכשיו היא נגזרת מהשעון
 *    לפי החוק שלה: משלישי ב-18:00 עד שישי ב-18:00 מוצג השניצל,
 *    ומשישי ב-18:00 עד שלישי ב-18:00 מוצג הקוסקוס.
 * 2. **הוצגה הודעת השגיאה של השרת.** ״היום סגור להזמנות״ הוא נוסח
 *    שנכתב לחסימת הזמנה, לא לשורת מידע.
 *
 * ⚠ **מתג התזכורת · 17 בספטמבר 2026** · בקשה של שקד: ״שיהיה סימון
 * של קו כזה על הפעמון, ואם ילחצו עליו שוב פשוט יקפוץ לכמה שניות
 * ההודעה ״התזכורת נמחקה״ והאייקון יתחלף בחזרה לפעמון בלי קו״.
 */

/** ⚠ צבעי המצב · ירוק וכתום מגווני הקטגוריות, האדום מ-`SaleClosedSheet` */
const STATE_INK: Record<SaleState, string> = {
  open: '#2C5A3E',
  pending: '#7A3D18',
  closed: '#8E3A32',
};
const STATE_RGB: Record<SaleState, string> = {
  open: '67,124,89',
  pending: '168,90,40',
  closed: '185,83,73',
};
const STATE_TEXT: Record<SaleState, string> = {
  open: 'המכירה החלה',
  /* ⚠ הנוסח של שקד · 18.9.2026 · ״המכירה טרם נפתחה״ */
  pending: 'המכירה טרם נפתחה',
  closed: 'המכירה נסגרה',
};

/** הנוסחים של המתג · בקשה של שקד */
const ON_TEXT = 'תזכורת הופעלה';
const OFF_TEXT = 'התזכורת נמחקה';

const BELL = 15;
const BELL_BTN = 30;

type Props = {
  /** פתיחת מסך הקטגוריה · פעילה רק כשהמכירה החלה */
  onOpen: (category: string) => void;
};

export function SaleDayRow({ onOpen }: Props) {
  /* ⚠ נקבע פעם אחת בכניסה למסך · שעון שרץ כאן היה מרנדר בלי סיבה */
  const upcoming = React.useMemo(() => upcomingSale(new Date()), []);
  const cat = CATEGORIES.find((c) => c.key === upcoming.cat);
  /**
   * ⚠ **שתי ההודעות עברו לשכבה הצפה · 17 בספטמבר 2026** · בקשה של
   * שקד: ״שההודעה ׳תזכורת נמחקה׳ לא תזיז דברים במסך הבית, שתופיע
   * כמו הודעה צפה״. קודם היא רונדרה כאן, מתחת לשורה, ולכן היא דחפה
   * את כל הכרטיסים שמתחתיה למטה ואז החזירה אותם.
   */
  const { cheer, toast } = useCheer();

  const [state, setState] = React.useState<SaleState | null>(null);
  /**
   * ⚠ **המצב מגיע מהמאגר המשותף · 17 בספטמבר 2026** · שקד דיווחה
   * ש״אין סנכרון בין התזכורת שמופיעה בדף הבית לבין התזכורת בעמוד
   * עצמו״. היה כאן `useState` מקומי · ראו `order/reminders`.
   */
  const on = useReminder(upcoming.cat) ?? false;
  const setOn = React.useCallback(
    (next: boolean) => setReminder(upcoming.cat, next),
    [upcoming.cat],
  );

  React.useEffect(() => {
    if (!apiEnabled) return;
    let live = true;
    void saleDayStatus(upcoming.cat)
      .then((d) => {
        if (!live) return;
        /* ⚠ שרת ישן מחזיר `open` בלבד · נגזר ממנו מצב סביר */
        setState(d.state ?? (d.open ? 'open' : 'pending'));
        setReminder(upcoming.cat, d.reminder ?? false);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [upcoming.cat]);

  const toggle = React.useCallback(() => {
    if (on) {
      setOn(false);
      toast(OFF_TEXT);
      /* ⚠ כישלון מחזיר את המתג · אחרת הלקוחה חושבת שביטלה ולא */
      void cancelSaleReminder(upcoming.cat).catch(() => setOn(true));
      return;
    }
    setOn(true);
    cheer(ON_TEXT);
    void requestSaleReminder(upcoming.cat).catch(() => setOn(false));
  }, [cheer, on, toast, upcoming.cat]);

  /* עד שהתשובה חוזרת אין מה להבטיח · עדיף לא להראות כלום מלשקר */
  if (!cat || !state) return null;

  const isOpen = state === 'open';

  return (
      <Pressable disabled={!isOpen} onPress={() => onOpen(upcoming.cat)} style={s.row}>
        <GlassFill stops={GLASS_STOPS} radius={radius.field} />
        <Text style={s.title}>{cat.sub}</Text>
        <View style={s.grow} />

        <View style={[s.chip, { backgroundColor: a(STATE_RGB[state], 0.16) }]}>
          <View style={[s.dot, { backgroundColor: STATE_INK[state] }]} />
          <Text style={[s.chipText, { color: STATE_INK[state] }]}>{STATE_TEXT[state]}</Text>
        </View>

        {/* ⚠ הפעמון רק כשטרם החלה · אין למה להזכיר ביום פתוח או סגור */}
        {state === 'pending' ? (
          <Pressable
            onPress={toggle}
            hitSlop={8}
            accessibilityRole="switch"
            accessibilityState={{ checked: on }}
            accessibilityLabel={on ? 'ביטול התזכורת' : 'תזכירו לי כשהמכירה תתחיל'}
            style={[s.bell, { backgroundColor: a(STATE_RGB.pending, on ? 0.3 : 0.16) }]}
          >
            <Bell size={BELL} color={STATE_INK.pending} strokeWidth={1.8} />
            {/* ⚠ הקו האלכסוני · ״סימון של קו כזה על הפעמון״ */}
            {on ? <View style={[s.slash, { backgroundColor: STATE_INK.pending }]} /> : null}
          </Pressable>
        ) : null}
      </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    /**
     * ⚠ **גובה קבוע · תוקן ב-17 בספטמבר 2026** · שקד דיווחה
     * ש״החלק הלבן לא בגודל המתאים לכל הכרטיסייה״. `GlassFill`
     * מצייר `Svg` ב-`height="100%"`, ואחוז אינו נפתר כשגובה
     * ההורה נגזר מהתוכן. עם גובה קבוע הזכוכית ממלאת הכל.
     */
    height: 54,
    borderRadius: radius.field,
    paddingHorizontal: 12,
    marginTop: space.sm,
    /**
     * ⚠ **רווח מהכרטיסים · בקשת שקד (16 בספטמבר 2026)** · ״צריך
     * להוסיף רווח בין הכרטיסייה הזו לבין הקארדים שמתחתיה״.
     */
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: surface.glassEdge,
    boxShadow: GLASS_SHADOW,
    overflow: 'hidden',
  },
  title: { fontSize: 13, fontWeight: '600', color: surface.ink },
  grow: { flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  chipText: { fontSize: type.label, fontWeight: '600' },
  bell: {
    width: BELL_BTN,
    height: BELL_BTN,
    borderRadius: BELL_BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* ⚠ אלכסון על הפעמון · 45 מעלות, מפינה לפינה של האייקון */
  slash: {
    position: 'absolute',
    width: BELL + 6,
    height: 1.8,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
});

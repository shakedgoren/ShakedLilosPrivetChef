import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Bell } from '../icons';
import { Confetti } from './Confetti';
import { GlassFill } from './Glass';
import { CATEGORIES } from '../data/categories';
import { upcomingSale } from '../data/saleWeek';
import { a, radius, space, surface, type } from '../theme/tokens';
import { GLASS_SHADOW, GLASS_STOPS } from '../theme/glass';
import { apiEnabled } from '../api/config';
import { requestSaleReminder, saleDayStatus, type SaleState } from '../api/orders';

/**
 * שורת יום המכירה הקרוב · דף הבית, אחרי התחברות.
 *
 * ⚠ **נכתבה מחדש ב-16 בספטמבר 2026** · שקד דיווחה שהשורה מציגה
 * ״היום סגור להזמנות״, ואמרה: ״שלא יראה היום סגור להזמנות אלא
 * יראה את יום המכירה הקרוב״. שתי בעיות היו כאן:
 *
 * 1. **הקטגוריה הייתה מקובעת לקוסקוס.** עכשיו היא נגזרת מהשעון
 *    לפי החוק שלה: משלישי ב-18:00 עד שישי ב-18:00 מוצג השניצל,
 *    ומשישי ב-18:00 עד שלישי ב-18:00 מוצג הקוסקוס. הפונקציה
 *    `upcomingSale` כבר מימשה בדיוק את זה בשביל דף הניהול.
 * 2. **הוצגה הודעת השגיאה של השרת.** ״היום סגור להזמנות״ הוא נוסח
 *    שנכתב לחסימת הזמנה, לא לשורת מידע. עכשיו מוצג שם יום המכירה,
 *    ולצידו תווית מצב.
 *
 * שלושת המצבים, הצבעים והנוסחים — בקשה מפורשת שלה.
 */

/** ⚠ צבעי המצב · ירוק וכתום מגווני הקטגוריות, האדום מ-`SaleClosedSheet` */
const STATE_INK: Record<SaleState, string> = {
  open: '#2C5A3E',
  pending: '#7A3D18',
  sold_out: '#8E3A32',
};
const STATE_RGB: Record<SaleState, string> = {
  open: '67,124,89',
  pending: '168,90,40',
  sold_out: '185,83,73',
};
const STATE_TEXT: Record<SaleState, string> = {
  open: 'המכירה החלה',
  pending: 'המכירה טרם החלה',
  sold_out: 'המכירה נסגרה',
};

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

  const [state, setState] = React.useState<SaleState | null>(null);
  const [asked, setAsked] = React.useState(false);
  const [cheer, setCheer] = React.useState(false);

  React.useEffect(() => {
    if (!apiEnabled) return;
    let live = true;
    void saleDayStatus(upcoming.cat)
      .then((d) => {
        if (!live) return;
        /* ⚠ שרת ישן מחזיר `open` בלבד · נגזר ממנו מצב סביר */
        setState(d.state ?? (d.open ? 'open' : 'pending'));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [upcoming.cat]);

  const remind = React.useCallback(() => {
    if (asked) return;
    setAsked(true);
    setCheer(true);
    /* התזכורת היא בונוס · כישלון שלה לא אמור לשבור את דף הבית */
    void requestSaleReminder(upcoming.cat).catch(() => setAsked(false));
  }, [asked, upcoming.cat]);

  /* עד שהתשובה חוזרת אין מה להבטיח · עדיף לא להראות כלום מלשקר */
  if (!cat || !state) return null;

  const open = state === 'open';

  return (
    <>
      <Pressable
        disabled={!open}
        onPress={() => onOpen(upcoming.cat)}
        style={s.row}
      >
        <GlassFill stops={GLASS_STOPS} radius={radius.field} />
        <Text style={s.title}>{cat.sub}</Text>
        <View style={s.grow} />

        <View style={[s.chip, { backgroundColor: a(STATE_RGB[state], 0.16) }]}>
          <View style={[s.dot, { backgroundColor: STATE_INK[state] }]} />
          <Text style={[s.chipText, { color: STATE_INK[state] }]}>{STATE_TEXT[state]}</Text>
        </View>

        {/* ⚠ הפעמון רק כשטרם החלה · בקשה של שקד, ״לקבל תזכורת
            באפליקציה כשהמכירה תתחיל״ */}
        {state === 'pending' ? (
          <Pressable
            onPress={remind}
            disabled={asked}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="תזכירו לי כשהמכירה תתחיל"
            style={[s.bell, { backgroundColor: a(STATE_RGB.pending, asked ? 0.3 : 0.16) }]}
          >
            <Bell size={BELL} color={STATE_INK.pending} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </Pressable>

      {cheer ? <Confetti onDone={() => setCheer(false)} /> : null}
    </>
  );
}

const s = StyleSheet.create({
  row: {
    minHeight: 50,
    borderRadius: radius.field,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: space.sm,
    /**
     * ⚠ **רווח מהכרטיסים · בקשת שקד (16 בספטמבר 2026)** · ״צריך
     * להוסיף רווח בין הכרטיסייה הזו לבין הקארדים שמתחתיה״.
     * קודם לא היה כאן מרווח תחתון כלל.
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
});

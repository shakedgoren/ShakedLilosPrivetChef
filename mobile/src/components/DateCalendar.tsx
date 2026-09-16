import React, { useState } from 'react';
import { S } from './Sym';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CAL_HINT, DOWS, MONTHS, dateOpen, dayKey } from '../data/calendar';
import { IS_RTL } from '../theme/rtl';
import { a, hues } from '../theme/tokens';

/**
 * לוח שנה לבחירת תאריך · `isCal` בקנבס (`Chef.dc.html`).
 * ימים שאינם פתוחים — עבר, או טווח חסום — אפורים ולא לחיצים.
 */

/* המידות מהקנבס · מסגרת 300, פינה 20, ריפוד 12 */
const BOARD_MAX = 300;
const CELL_H = 32;
const CELL_RADIUS = 10;
const GRID_GAP = 3;
const COLS = 7;

/* חצי החודש · עיגול 28 עם חץ 12 בעובי 2.6 */
const NAV = 28;
const NAV_GLYPH = 12;
const NAV_STROKE = 2.6;

/** ברירת המחדל · גוון השף, כמו ב-`Chef.dc.html` */
const DEFAULT_ACCENT = hues.chef;
const MUTE = '#A79FB2';
const OFF_INK = '#C9C3D1';

/** חץ החודש הקודם כשאין לאן לחזור · `prevOp` בקנבס */
const PAST_OPACITY = 0.35;

type Props = {
  /** התאריך שנבחר · מפתח `YYYY-MM-DD` */
  value?: string;
  onPick: (key: string) => void;
  /** אילו ימים פתוחים · ברירת המחדל היא הכלל של פינת השף */
  isOpen?: (key: string) => boolean;
  /** ההסבר מתחת ללוח */
  hint?: string;
  /** גוון הקטגוריה · מגשי הפירות מציגים את אותו לוח בוורוד */
  accent?: { hue: string; deep: string; rgb: string };
};

export function DateCalendar({
  value,
  onPick,
  isOpen = dateOpen,
  hint = CAL_HINT,
  accent = DEFAULT_ACCENT,
}: Props) {
  const MARK = accent.hue;
  const MARK_INK = accent.deep;
  const MARK_SOFT = a(accent.rgb, 0.09);
  const NAV_BG = a(accent.rgb, 0.1);
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());

  /* כמה תאים ריקים לפני הראשון בחודש · `getDay()` של ה-1 */
  const lead = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  /* אי אפשר לרדת מתחת לחודש הנוכחי · אין תאריכים בעבר */
  const atNow = y === now.getFullYear() && m === now.getMonth();

  const stepMonth = (d: number) => {
    const next = m + d;
    if (next < 0) { setM(11); setY(y - 1); return; }
    if (next > 11) { setM(0); setY(y + 1); return; }
    setM(next);
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < lead; i++) cells.push(<View key={`pad-${i}`} style={st.cell} />);
  for (let d = 1; d <= total; d++) {
    const k = dayKey(y, m, d);
    const open = isOpen(k);
    const sel = value === k;
    cells.push(
      <Pressable
        key={k}
        onPress={open ? () => onPick(k) : undefined}
        disabled={!open}
        style={[st.cell, { backgroundColor: sel ? MARK : open ? MARK_SOFT : 'transparent' }]}
      >
        <Text
          style={[
            st.day,
            {
              color: sel ? '#FFFFFF' : open ? MARK_INK : OFF_INK,
              fontWeight: sel ? '700' : open ? '600' : '300',
            },
          ]}
        >
          {d}
        </Text>
      </Pressable>,
    );
  }

  return (
    <View style={st.board}>
      {/* ⚠ `direction: ltr` בקנבס · החץ קדימה בשמאל והחץ אחורה בימין */}
      <View style={st.head}>
        <Pressable onPress={() => stepMonth(1)} style={[st.nav, { backgroundColor: NAV_BG }]} hitSlop={6}>
          <S k="chevronLeft" size={NAV_GLYPH} color={MARK_INK} />
        </Pressable>
        <Text style={st.month}>
          {MONTHS[m]} {y}
        </Text>
        <Pressable
          onPress={atNow ? undefined : () => stepMonth(-1)}
          disabled={atNow}
          style={[st.nav, { backgroundColor: NAV_BG }, atNow && { opacity: PAST_OPACITY }]}
          hitSlop={6}
        >
          <S k="chevronRight" size={NAV_GLYPH} color={MARK_INK} />
        </Pressable>
      </View>

      <View style={st.grid}>
        {DOWS.map((t) => (
          <View key={t} style={st.dowCell}>
            <Text style={st.dow}>{t}</Text>
          </View>
        ))}
        {cells}
      </View>

      <Text style={st.hint}>{hint}</Text>
    </View>
  );
}

/** רוחב תא · אותה נוסחה של `--opt-basis` בקנבס */
const CELL_BASIS = `calc((100% - ${(COLS - 1) * GRID_GAP}px) / ${COLS})` as unknown as number;

const st = StyleSheet.create({
  board: {
    width: '100%',
    maxWidth: BOARD_MAX,
    alignSelf: 'center',
    borderRadius: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.16)',
  },
  /**
   * ⚠ הקנבס קובע `direction: ltr` על השורה הזו, כך שהחץ קדימה יושב
   * בשמאל. ל-React Native אין `direction` בסגנון (״Invalid style
   * property״ בקונסולה), ולכן היפוך הסדר נעשה ב-`row-reverse` תחת
   * RTL. בלי זה השניים יצאו הפוך — נמדד: ״קדימה״ ב-x=304 במקום 59.
   */
  head: { flexDirection: IS_RTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 },
  nav: {
    width: NAV,
    height: NAV,
    borderRadius: NAV / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: { flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: '600', color: '#2A2430' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginTop: 10 },
  dowCell: { width: CELL_BASIS, alignItems: 'center' },
  dow: { fontSize: 10, fontWeight: '600', color: MUTE },
  cell: {
    width: CELL_BASIS,
    height: CELL_H,
    borderRadius: CELL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { fontSize: 12.5 },
  hint: { marginTop: 9, fontSize: 10.5, fontWeight: '300', color: MUTE, textAlign: 'center' },
});

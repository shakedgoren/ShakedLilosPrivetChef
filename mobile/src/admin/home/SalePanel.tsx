import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../ui/text';
import Svg, { Circle } from 'react-native-svg';
import { GlassCard } from './GlassCard';
import { LAV, NightSky, SOFT_SHADOW } from './NightSky';
import type { DishRow } from './useAdminHome';
import { NO_TOUCH } from '../../theme/pointerEvents';

/**
 * לוח יום המכירה · ״גלקסיה״ עם דיאגרמת ״מסלולים״.
 *
 * ⚠ **אינו מהקנבס** · שקד בחרה (15 בספטמבר 2026) מתוך חמש הצעות
 * את **רקע הלילה של הצעה 1** ואת **דיאגרמת המסלולים של הצעה 2**.
 * שפת התנועה נלקחה מקובץ הלוטי ששלחה (`Sostav_of_Milky_Way`):
 * קשת שנסחפת פנימה לכל מנה, ולווין קטן שנוחת בקצה שלה.
 *
 * ⚠ **המספרים נלחצים** · בקשה מפורשת שלה — גם המלאי וגם מה
 * שנמכר. לחיצה הופכת את המספר לשדה הקלדה; שמירה ביציאה מהשדה.
 * התיקון של ״נמכר״ גובר על הספירה מההזמנות עד שמוחקים אותו.
 *
 * ⚠ **סדר המספרים** · שקד ביקשה (15 בספטמבר 2026): **מימין ל-/**
 * המלאי שהוגדר ביום המכירה, **משמאל ל-/** מה שהוזמן בפועל
 * מההזמנות של אותו תאריך.
 */

/**
 * ⚠ **קטן מ-150** · נמדד בדפדפן ששמות המנות נחתכו (״תוספת י…״)
 * כי הטבעת בלעה מחצית מרוחב הכרטיס. ב-116 נשארים כ-90 פיקסלים
 * לשם, וכל השמות נכנסים.
 */
const RING = 116;
const CX = RING / 2;
/** רדיוס חיצוני ומרחק בין מסלולים · שש מנות נכנסות בדיוק */
const R_OUT = 52;
const R_GAP = 7.5;

/* גווני המסלולים · מהעז לרך, מתוך ערכת לבנדר */
const ORBIT = LAV.hues;

type Props = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  dishes: DishRow[];
  onSetQuota: (id: string, value: number) => void;
  onSetSold: (id: string, value: number | null) => void;
  pct: number;
  sold: number;
  quota: number;
};

/** מספר שנלחץ · לחיצה פותחת הקלדה, יציאה מהשדה שומרת */
function Editable({
  value,
  onSave,
  style,
  tone,
}: {
  value: number;
  onSave: (n: number) => void;
  style: object;
  tone: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  if (!editing) {
    return (
      <Pressable
        onPress={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        hitSlop={8}
      >
        <Text style={[style, { color: tone }]}>{value}</Text>
      </Pressable>
    );
  }

  const commit = () => {
    setEditing(false);
    const n = parseInt(draft.replace(/[^\d]/g, ''), 10);
    if (Number.isFinite(n) && n !== value) onSave(n);
  };

  /* ⚠ תיבת ההקלדה ברוחב מינימלי · בקשה של שקד */
  return (
    <TextInput
      value={draft}
      onChangeText={setDraft}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="number-pad"
      selectTextOnFocus
      autoFocus
      style={[style, s.input, { color: tone }]}
    />
  );
}

export function SalePanel({
  label,
  isOpen,
  onToggle,
  dishes,
  onSetQuota,
  onSetSold,
  pct,
  sold,
  quota,
}: Props) {
  return (
    <GlassCard style={s.card}>
      <NightSky />

      <View style={s.head}>
        <Text style={s.day}>{`יום מכירה · ${label}`}</Text>
        <Pressable onPress={onToggle} style={s.toggle} hitSlop={8}>
          <Text style={[s.state, { color: isOpen ? LAV.good : LAV.faint }]}>
            {isOpen ? 'פתוח' : 'סגור'}
          </Text>
          <View style={[s.track, { backgroundColor: isOpen ? LAV.good : 'rgba(142,111,208,0.24)' }]}>
            <View style={[s.knob, isOpen ? s.knobOn : s.knobOff]} />
          </View>
        </Pressable>
      </View>

      <View style={s.body}>
        {/* ── דיאגרמת המסלולים · טבעת לכל מנה ── */}
        <View style={s.ringBox}>
          <Svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`}>
            {dishes.map((d, i) => {
              const r = R_OUT - i * R_GAP;
              const c = 2 * Math.PI * r;
              const frac = d.quota > 0 ? Math.min(1, d.sold / d.quota) : 0;
              const hue = ORBIT[i % ORBIT.length];
              const angle = frac * 2 * Math.PI - Math.PI / 2;
              return (
                <React.Fragment key={d.id}>
                  <Circle cx={CX} cy={CX} r={r} fill="none" stroke={LAV.edge} strokeWidth={5} />
                  {frac > 0 ? (
                    <Circle
                      cx={CX}
                      cy={CX}
                      r={r}
                      fill="none"
                      stroke={hue}
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeDasharray={`${(c * frac).toFixed(2)} ${(c * (1 - frac)).toFixed(2)}`}
                      /* ⚠ מתחיל בשעה 12 · בלי הסיבוב הקשת יוצאת מהצד */
                      transform={`rotate(-90 ${CX} ${CX})`}
                    />
                  ) : null}
                  {frac > 0 ? (
                    <Circle
                      cx={CX + r * Math.cos(angle)}
                      cy={CX + r * Math.sin(angle)}
                      r={3.4}
                      fill="#FFFFFF"
                      stroke={hue}
                      strokeWidth={2}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </Svg>
          <View style={[s.ringText, NO_TOUCH]}>
            <Text style={s.ringPct}>{`${pct}%`}</Text>
            <Text style={s.ringNote}>נמכר</Text>
          </View>
        </View>

        {/* ── שורות המנות ── */}
        <View style={s.rows}>
          {dishes.map((d, i) => {
            const hue = ORBIT[i % ORBIT.length];
            return (
              <View key={d.id} style={s.row}>
                <View style={[s.dot, { backgroundColor: hue }]} />
                <Text style={s.name} numberOfLines={1}>
                  {d.name}
                </Text>
                {/* ⚠ **המלאי מימין ל-/** · בקשה מפורשת של שקד
                    (15 בספטמבר 2026). המספר הזה הוא המלאי שהוגדר
                    ביום המכירה — `quotasJson` של אותו תאריך.
                    ⚠ **בלי מדרגות** · שני המספרים מתנהגים אותו דבר —
                    לחיצה והקלדה, בלי כפתורי + ו-−. */}
                <Editable value={d.quota} onSave={(n) => onSetQuota(d.id, n)} style={s.quota} tone={LAV.ink} />
                <Text style={s.slash}>/</Text>
                {/* ⚠ **ההזמנות משמאל ל-/** · נספר מההזמנות של אותו
                    תאריך מכירה, לפי המנה שהוזמנה. */}
                <Editable
                  value={d.sold}
                  onSave={(n) => onSetSold(d.id, n)}
                  style={s.sold}
                  tone={d.sold > 0 ? LAV.ink : LAV.faint}
                />
              </View>
            );
          })}
        </View>
      </View>

    </GlassCard>
  );
}

const s = StyleSheet.create({
  /**
   * ⚠ רקע לילה · דורס את הזכוכית הלבנה של `GlassCard`.
   * ל-React Native אין גרדיאנט רדיאלי ב-CSS, ולכן הגוון מושג
   * בצבע אחד עם מסגרת בהירה — נמדד בדפדפן שזה קרוב מספיק.
   */
  /* ⚠ המדרגה הראשונה של הגרדיאנט · הכרטיס העליון בדף */
  card: {
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
    backgroundColor: LAV.tints[0],
    borderWidth: 1,
    borderColor: LAV.edge,
    boxShadow: SOFT_SHADOW,
  } as never,

  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  day: { flex: 1, fontSize: 15, fontWeight: '600', color: LAV.dim },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  state: { fontSize: 13, fontWeight: '600' },
  track: { width: 40, height: 23, borderRadius: 999, justifyContent: 'center' },
  knob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  knobOn: { start: 2.5 },
  knobOff: { start: 19.5 },

  body: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  ringBox: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ringText: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 24, fontWeight: '300', color: LAV.ink },
  ringNote: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.1, color: LAV.faint },

  rows: { flex: 1, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  name: { flex: 1, fontSize: 12.5, fontWeight: '400', color: LAV.soft },
  /* ⚠ רוחב מינימלי זהה לשניהם · כך הלוכסנים יושבים בטור אחד */
  sold: { fontSize: 13, fontWeight: '700', minWidth: 22, textAlign: 'center' },
  slash: { fontSize: 12.5, fontWeight: '300', color: LAV.faint },
  quota: { minWidth: 22, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  /* שדה ההקלדה · אותן מידות של המספר, כדי שהשורה לא תקפוץ */
  input: { width: 26, padding: 0, borderBottomWidth: 1.5, borderBottomColor: LAV.accent },

});

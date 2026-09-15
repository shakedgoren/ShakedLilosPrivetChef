import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { GlassCard } from './GlassCard';
import type { DishRow } from './useAdminHome';

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
const TRACK = 'rgba(184,166,232,0.16)';

/* גווני המסלולים · מהעז לרך, כמו שכבות של גלקסיה */
const ORBIT = ['#B79CFF', '#A78BF5', '#9679E8', '#8869DB', '#7A5ACE', '#6D4EC0'];

/* שמי הלילה · הכוכבים מפוזרים פעם אחת ולא בכל ציור */
const STARS = [
  [8, 14], [22, 61], [37, 9], [52, 78], [63, 27], [74, 54],
  [86, 17], [93, 69], [15, 88], [45, 41], [68, 92], [29, 33],
] as const;

type Props = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  dishes: DishRow[];
  onBump: (id: string, delta: number) => void;
  onSetQuota: (id: string, value: number) => void;
  onSetSold: (id: string, value: number | null) => void;
  step: number;
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
  onBump,
  onSetQuota,
  onSetSold,
  step,
  pct,
  sold,
  quota,
}: Props) {
  return (
    <GlassCard style={s.card}>
      {/* שמי הלילה · הכוכבים מתחת לכל השאר */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map(([x, y], i) => (
          <View
            key={i}
            style={[s.star, { left: `${x}%`, top: `${y}%`, opacity: 0.22 + (i % 4) * 0.13 }]}
          />
        ))}
      </View>

      <View style={s.head}>
        <Text style={s.day}>{`יום מכירה · ${label}`}</Text>
        <Pressable onPress={onToggle} style={s.toggle} hitSlop={8}>
          <Text style={[s.state, { color: isOpen ? '#7BD6A0' : '#9C8DC4' }]}>
            {isOpen ? 'פתוח' : 'סגור'}
          </Text>
          <View style={[s.track, { backgroundColor: isOpen ? '#4E8A64' : 'rgba(184,166,232,0.26)' }]}>
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
                  <Circle cx={CX} cy={CX} r={r} fill="none" stroke={TRACK} strokeWidth={5} />
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
          <View style={s.ringText} pointerEvents="none">
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
                {/* נמכר · נלחץ להקלדה */}
                <Editable
                  value={d.sold}
                  onSave={(n) => onSetSold(d.id, n)}
                  style={s.sold}
                  tone={d.sold > 0 ? '#FFFFFF' : '#8073AA'}
                />
                <Text style={s.slash}>/</Text>
                {/* המלאי · נלחץ להקלדה, ולצידו המדרגות */}
                <View style={s.pill}>
                  <Pressable onPress={() => onBump(d.id, -step)} style={s.step} hitSlop={6}>
                    <Text style={[s.stepGlyph, { color: hue }]}>−</Text>
                  </Pressable>
                  <Editable value={d.quota} onSave={(n) => onSetQuota(d.id, n)} style={s.quota} tone="#FFFFFF" />
                  <Pressable onPress={() => onBump(d.id, step)} style={s.step} hitSlop={6}>
                    <Text style={[s.stepGlyph, { color: hue }]}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={s.foot}>{`נמכר מתוך המלאי · ${sold} מתוך ${quota} · אפשר ללחוץ על כל מספר ולהקליד`}</Text>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  /**
   * ⚠ רקע לילה · דורס את הזכוכית הלבנה של `GlassCard`.
   * ל-React Native אין גרדיאנט רדיאלי ב-CSS, ולכן הגוון מושג
   * בצבע אחד עם מסגרת בהירה — נמדד בדפדפן שזה קרוב מספיק.
   */
  card: {
    borderRadius: 22,
    paddingVertical: 13,
    paddingHorizontal: 14,
    overflow: 'hidden',
    backgroundColor: '#211741',
    borderWidth: 1,
    borderColor: 'rgba(184,166,232,0.22)',
    boxShadow: '0 20px 44px -26px rgba(23,17,40,0.9)',
  } as never,
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#D7CBFF' },

  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  day: { flex: 1, fontSize: 13, fontWeight: '600', color: '#EDE6FF' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  state: { fontSize: 11.5, fontWeight: '600' },
  track: { width: 40, height: 23, borderRadius: 999, justifyContent: 'center' },
  knob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  knobOn: { start: 2.5 },
  knobOff: { start: 19.5 },

  body: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  ringBox: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ringText: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 21, fontWeight: '200', color: '#FFFFFF' },
  ringNote: { fontSize: 9, fontWeight: '500', letterSpacing: 1.1, color: '#A294D0' },

  rows: { flex: 1, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  name: { flex: 1, fontSize: 11, fontWeight: '300', color: '#D9CFF4' },
  sold: { fontSize: 11.5, fontWeight: '600', minWidth: 16, textAlign: 'center' },
  slash: { fontSize: 11, fontWeight: '300', color: '#6F62A0' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(184,166,232,0.13)',
    flexShrink: 0,
  },
  step: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: { fontSize: 11, fontWeight: '700', lineHeight: 13 },
  quota: { minWidth: 20, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  /* שדה ההקלדה · אותן מידות של המספר, כדי שהשורה לא תקפוץ */
  input: { padding: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(184,166,232,0.5)' },

  foot: { fontSize: 10, fontWeight: '300', color: '#8E80B8', marginTop: 10 },
});

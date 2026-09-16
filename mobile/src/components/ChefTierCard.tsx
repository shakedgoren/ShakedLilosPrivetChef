import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';

/**
 * כרטיס דרגה בארוחת שף · `isTiers` בקנבס (`Chef.dc.html`).
 * השם, ניצוץ, פירוט המנות, והמחיר לסועד מתחתיו.
 * כשהציר עוד לא נבחר הכרטיס אפור ולא לחיץ — אבל **נשאר על המסך**,
 * כדי שיהיה אפשר לראות מה מחכה בכל דרגה.
 */

/* גווני הקנבס · `chip(on)` לכרטיס פעיל, והאפור לנעול */
const SEL_BG = 'rgba(168,90,40,0.1)';
const SEL_BD = 'rgba(168,90,40,0.42)';
const IDLE_BG = 'rgba(255,255,255,0.7)';
const IDLE_BD = 'rgba(130,112,162,0.16)';
const OFF_BG = 'rgba(130,112,162,0.05)';
const OFF_BD = 'rgba(130,112,162,0.12)';
const OFF_INK = '#BDB7C6';
const SEL_INK = '#7A3D18';
const INK = '#4A4254';
const LINE_INK = '#7D7488';
const PRICE_INK = '#A85A28';

/** הכרטיס הנעול · `opacity: 0.55` בקנבס, לא הסתרה */
const OFF_OPACITY = 0.55;

/** ״—״ · מה שהקנבס מציג כשאין עדיין ציר ולכן אין מחיר */
const NO_PRICE = '—';

type Props = {
  name: string;
  /** פירוט המנות · `TIER_LINES[k]` בקנבס */
  lines: readonly string[];
  /** המחיר לסועד · null כשהציר עוד לא נבחר */
  price: number | null;
  on: boolean;
  /** נעול · הציר עוד לא נבחר */
  locked: boolean;
  onPress: () => void;
};

export function ChefTierCard({ name, lines, price, on, locked, onPress }: Props) {
  const ink = locked ? OFF_INK : on ? SEL_INK : INK;
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      /* ⚠ הנעילה על הכרטיס עצמו · בקנבס `pick` הוא פונקציה ריקה
         כשהכרטיס נעול, והכרטיס נשאר מצויר במלואו */
      disabled={locked}
      style={[
        s.card,
        {
          backgroundColor: locked ? OFF_BG : on ? SEL_BG : IDLE_BG,
          borderColor: locked ? OFF_BD : on ? SEL_BD : IDLE_BD,
          opacity: locked ? OFF_OPACITY : 1,
        },
      ]}
    >
      <Text style={[s.name, { color: ink, fontWeight: on ? '600' : '400' }]}>{name}</Text>
      <Text style={s.spark}>✨</Text>
      <View style={s.lines}>
        {lines.map((t) => (
          <Text key={t} numberOfLines={1} style={[s.line, locked && { color: OFF_INK }]}>
            {t}
          </Text>
        ))}
      </View>
      <Text style={[s.price, locked && { color: OFF_INK }]}>{price == null ? NO_PRICE : price}</Text>
      <Text style={[s.per, locked && { color: OFF_INK }]}>₪ לסועד</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  /* `border-radius: 18; padding: 12px 6px; gap: 4` · מהקנבס */
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  name: { fontSize: 13, lineHeight: 16.25, textAlign: 'center' },
  spark: { fontSize: 12, lineHeight: 12 },
  /* `gap: 1; padding: 2px 0` · מהקנבס */
  lines: { alignItems: 'center', gap: 1, paddingVertical: 2 },
  line: { fontSize: 10, fontWeight: '300', color: LINE_INK },
  /* `font-variant-numeric: tabular-nums` · שלושת המחירים מיושרים */
  price: { fontSize: 15, fontWeight: '700', color: PRICE_INK, fontVariant: ['tabular-nums'] },
  per: { fontSize: 9.5, fontWeight: '400', color: LINE_INK },
});

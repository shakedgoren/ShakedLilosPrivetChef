import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { CTA_KNOB_SHADOW, CTA_SHADOW, CTA_STOPS } from '../theme/glass';
import { radius } from '../theme/tokens';
import { ArrowLeft } from '../icons';

/**
 * הכפתור הסגול הראשי · הגרדיאנט, ערימת הצללים ועיגול החץ
 * מגיעים אחד לאחד מכפתור ״מתחילים את המסע״ ב-Guest.dc.html.
 * החץ יושב בקצה הכפתור — ב-RTL זהו הצד השמאלי.
 */
const W = 250;
const H = 40;
const KNOB = 32;
const KNOB_INSET = 4;
const ARROW = 15;

type Props = { label: string; onPress: () => void };

let seq = 0;
const nextId = () => `cta${(seq += 1)}`;

export function PrimaryButton({ label, onPress }: Props) {
  const id = React.useMemo(nextId, []);
  const step = 1 / (CTA_STOPS.length - 1);

  return (
    <Pressable onPress={onPress} style={s.button}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          {/* 104 מעלות ב-CSS · הווקטור (sin104, ‎-cos104) = (0.97, 0.24) */}
          <LinearGradient id={id} x1="0" y1="0" x2="0.97" y2="0.24">
            {CTA_STOPS.map((c, i) => (
              <Stop key={c + i} offset={i === 1 ? 0.58 : i * step} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={H / 2} fill={`url(#${id})`} />
      </Svg>

      <Text style={s.label}>{label}</Text>

      <View style={s.knob}>
        <ArrowLeft size={ARROW} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    width: W,
    height: H,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CTA_SHADOW,
  },
  label: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  knob: {
    position: 'absolute',
    left: KNOB_INSET,
    top: KNOB_INSET,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CTA_KNOB_SHADOW,
  },
});

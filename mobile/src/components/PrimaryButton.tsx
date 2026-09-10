import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { CTA_GLOW_BLUR, CTA_GLOW_RGB, CTA_GLOW_SPREAD, CTA_KNOB_SHADOW, CTA_SHADOW, CTA_STOPS } from '../theme/glass';
import { a, radius } from '../theme/tokens';
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
    <View style={s.wrap}>
      {/* ההילה · אותה שפה של הבועות בשורת הקטגוריות. בקנבס לכפתור
          יש רק צל עדין, ושקד ביקשה שיזהר כמו שאר הדף. */}
      <View pointerEvents="none" style={s.glow}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={`${id}h`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={a(CTA_GLOW_RGB, 0.5)} />
              <Stop offset="0.55" stopColor={a(CTA_GLOW_RGB, 0.18)} />
              <Stop offset="0.82" stopColor={a(CTA_GLOW_RGB, 0)} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}h)`} />
        </Svg>
      </View>

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
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    left: -CTA_GLOW_SPREAD,
    right: -CTA_GLOW_SPREAD,
    top: -CTA_GLOW_SPREAD,
    bottom: -CTA_GLOW_SPREAD,
    borderRadius: 999,
    filter: `blur(${CTA_GLOW_BLUR}px)`,
  },
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

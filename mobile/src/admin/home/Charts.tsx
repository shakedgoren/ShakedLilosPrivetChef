import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { surface } from '../../theme/tokens';
import { DONUT, PROFIT, REVENUE } from '../../data/adminHome';

/** מד המכסה · טבעת לכל יום מכירה פתוח, גדולה לראשון וקטנה לשני */
export function QuotaRings({
  quotas,
  pct,
}: {
  quotas: { hue: string; sold: number; quota: number }[];
  pct: string;
}) {
  /* אורך הקשת מתוך היקף המעגל · בדיוק החישוב שבקנבס */
  const arc = (r: number, part: number) => {
    const c = 2 * Math.PI * r;
    const on = c * Math.max(0, Math.min(1, part));
    return `${on.toFixed(1)} ${(c - on).toFixed(1)}`;
  };
  const radii = [38, 28];

  return (
    <View style={s.ringBox}>
      <Svg width={92} height={92} viewBox="0 0 92 92">
        {quotas.map((q, i) => (
          <Circle
            key={`bg-${i}`}
            cx={46}
            cy={46}
            r={radii[i]}
            fill="none"
            stroke="rgba(130,112,162,0.13)"
            strokeWidth={8}
          />
        ))}
        {quotas.map((q, i) => (
          <Circle
            key={`on-${i}`}
            cx={46}
            cy={46}
            r={radii[i]}
            fill="none"
            stroke={q.hue}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={arc(radii[i], q.sold / q.quota)}
            transform="rotate(-90 46 46)"
          />
        ))}
      </Svg>
      <View style={s.ringCenter}>
        <Text style={s.ringPct}>{pct}</Text>
      </View>
    </View>
  );
}

/** גרף המחזור · ששת החודשים האחרונים */
export function RevenueChart() {
  return (
    <Svg width="100%" height={102} viewBox="0 0 322 110">
      <Defs>
        <LinearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7B5CBC" stopOpacity={0.42} />
          <Stop offset="100%" stopColor="#7B5CBC" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {[8, 37, 67, 96].map((y, i) => (
        <Line
          key={y}
          x1={30}
          y1={y}
          x2={320}
          y2={y}
          stroke={i === 3 ? 'rgba(130,112,162,0.18)' : 'rgba(130,112,162,0.1)'}
          strokeWidth={1}
        />
      ))}
      {[8, 37, 67, 96].map((y, i) => (
        <SvgText
          key={`ax-${y}`}
          x={26}
          y={y + 3}
          textAnchor="end"
          fontSize={9}
          fontWeight="300"
          fill="#9A93A6"
        >
          {REVENUE.axis[i]}
        </SvgText>
      ))}
      <Path d={REVENUE.area} fill="url(#revfill)" />
      <Path
        d={REVENUE.line}
        fill="none"
        stroke="#7B5CBC"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {REVENUE.dots.map((p, i) => {
        const last = i === REVENUE.dots.length - 1;
        return (
          <Circle
            key={p.cx}
            cx={p.cx}
            cy={p.cy}
            r={last ? 4.2 : 2.6}
            fill={last ? '#7B5CBC' : '#FFFFFF'}
            stroke={last ? '#FFFFFF' : '#7B5CBC'}
            strokeWidth={last ? 2.4 : 2}
          />
        );
      })}
      <Rect x={222} y={0} width={66} height={19} rx={9.5} fill="#7B5CBC" />
      <SvgText x={255} y={13.5} textAnchor="middle" fontSize={11} fontWeight="600" fill="#FFFFFF">
        {REVENUE.tip}
      </SvgText>
    </Svg>
  );
}

/** דונאט פילוח הקטגוריות */
export function CategoryDonut() {
  return (
    <View style={s.donutBox}>
      <Svg width={74} height={74} viewBox="0 0 74 74">
        {DONUT.arcs.map((a) => (
          <Circle
            key={a.color}
            cx={37}
            cy={37}
            r={29}
            fill="none"
            stroke={a.color}
            strokeWidth={9}
            strokeDasharray={a.dash}
            strokeDashoffset={a.offset}
            transform="rotate(-90 37 37)"
          />
        ))}
      </Svg>
      <View style={s.donutCenter}>
        <Text style={s.donutText}>{DONUT.center}</Text>
      </View>
    </View>
  );
}

/** עמודות הרווח · ששת החודשים, האחרונה מודגשת */
export function ProfitBars() {
  return (
    <Svg width="100%" height={30} viewBox="0 0 148 30">
      <Defs>
        <LinearGradient id="profbar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#437C59" stopOpacity={0.95} />
          <Stop offset="100%" stopColor="#437C59" stopOpacity={0.35} />
        </LinearGradient>
      </Defs>
      {PROFIT.bars.map((b, i) => (
        <Rect
          key={b.x}
          x={b.x}
          y={b.y}
          width={18}
          height={b.h}
          rx={4}
          fill={i === PROFIT.bars.length - 1 ? '#437C59' : 'url(#profbar)'}
        />
      ))}
    </Svg>
  );
}

const s = StyleSheet.create({
  ringBox: { width: 92, height: 92 },
  ringCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: { fontSize: 15, fontWeight: '600', color: surface.ink },
  donutBox: { width: 74, height: 74 },
  donutCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutText: { fontSize: 13, fontWeight: '600', color: surface.ink },
});

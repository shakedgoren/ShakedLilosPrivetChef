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
/** נקודה בגרף · תווית הציר והסכום */
export type RevPoint = { k: string; v: number };

/* מערכת הקואורדינטות של הקנבס · 322×110, עם 30 פיקסלים לציר המספרים */
const CHART = { w: 322, h: 110, left: 30, right: 320, top: 8, base: 96 } as const;

/** ‎12000 → ‎12k · כמו בקנבס */
const axisLabel = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n)));

/**
 * גרף המחזור · מצויר מהנתונים ולא מנתיב קבוע.
 *
 * ⚠ **היה קבוע מהקנבס** · הנתיב, החודשים והסכומים היו מחרוזות
 * שחולצו מהארטבורד, ולכן הגרף הראה תמיד את אותם ששה חודשים.
 * שקד ביקשה (15 בספטמבר 2026) לבחור טווח — היום, השבוע, החודש
 * או חצי שנה — ולכן הוא מקבל עכשיו נקודות ומחשב את הסקאלה בעצמו.
 */
export function RevenueChart({ points, night = false }: { points: RevPoint[]; night?: boolean }) {
  /* ⚠ שתי ערכות · הכהה נבחרה על ידי שקד ל״ליל־יום״ */
  const ink = night ? '#B79CFF' : '#7B5CBC';
  const rule = night
    ? ['rgba(184,166,232,0.12)', 'rgba(184,166,232,0.22)']
    : ['rgba(130,112,162,0.1)', 'rgba(130,112,162,0.18)'];
  const axisInk = night ? '#8E80B8' : '#9A93A6';
  /* הנקודה האחרונה · על רקע לילה המילוי שלה הוא הלילה עצמו */
  const dotFill = night ? '#211741' : '#FFFFFF';
  const n = points.length;
  /* ⚠ סקאלה עגולה כלפי מעלה · אחרת הקו נוגע בתקרה */
  const peak = Math.max(1, ...points.map((p) => p.v));
  const step = Math.pow(10, Math.max(0, String(Math.round(peak)).length - 2));
  const top = Math.ceil(peak / step) * step || 1;
  const grid = [top, (top * 2) / 3, top / 3, 0];

  const x = (i: number) =>
    n <= 1 ? CHART.right : CHART.left + 12 + ((CHART.right - CHART.left - 24) * i) / (n - 1);
  const y = (v: number) => CHART.base - (v / top) * (CHART.base - CHART.top);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = n
    ? `${line} L${x(n - 1).toFixed(1)},${CHART.base} L${x(0).toFixed(1)},${CHART.base} Z`
    : '';

  return (
    <Svg width="100%" height={102} viewBox={`0 0 ${CHART.w} ${CHART.h}`}>
      <Defs>
        <LinearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={ink} stopOpacity={night ? 0.5 : 0.42} />
          <Stop offset="100%" stopColor={ink} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {[CHART.top, 37, 67, CHART.base].map((gy, i) => (
        <Line
          key={gy}
          x1={CHART.left}
          y1={gy}
          x2={CHART.right}
          y2={gy}
          stroke={i === 3 ? rule[1] : rule[0]}
          strokeWidth={1}
        />
      ))}
      {[CHART.top, 37, 67, CHART.base].map((gy, i) => (
        <SvgText key={`ax-${gy}`} x={26} y={gy + 3} textAnchor="end" fontSize={9} fontWeight="300" fill={axisInk}>
          {axisLabel(grid[i])}
        </SvgText>
      ))}
      {n > 1 ? <Path d={area} fill="url(#revfill)" /> : null}
      {n > 1 ? (
        <Path d={line} fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {points.map((p, i) => {
        const last = i === n - 1;
        /* ⚠ הילה סביב האחרונה · ״כוכב שנוחת בקצה הקו״ מהתצוגה
           המקדימה שאישרה שקד */
        return (
          <React.Fragment key={`${p.k}-${i}`}>
            {last ? <Circle cx={x(i)} cy={y(p.v)} r={7.5} fill={ink} opacity={0.26} /> : null}
            <Circle
              cx={x(i)}
              cy={y(p.v)}
              r={last ? 4.2 : 2.6}
              fill={last ? ink : dotFill}
              stroke={last ? dotFill : ink}
              strokeWidth={last ? 2.4 : 2}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

/**
 * הדונאט של הקטגוריות.
 *
 * ⚠ **מחושב ולא מהקנבס** · הקשתות בקנבס הן מחרוזות `dash`/`offset`
 * קבועות שכוללות גם פירות. שקד ביקשה (15 בספטמבר 2026) להוציא
 * את הפירות — הם אינם ההכנסה שלה — ומחיקת קשת אחת מתוך ארבע
 * הייתה משאירה חור בטבעת. לכן הן נגזרות מהמקרא, מנורמלות ל-100%.
 */
const R = 29;
const C = 2 * Math.PI * R;

export function CategoryDonut() {
  const parts = DONUT.legend.filter((l) => l.name !== 'פירות');
  const sum = parts.reduce((t, l) => t + l.pct, 0) || 1;
  let at = 0;

  return (
    <View style={s.donutBox}>
      <Svg width={74} height={74} viewBox="0 0 74 74">
        {parts.map((l) => {
          const seg = (l.pct / sum) * C;
          const offset = -at;
          at += seg;
          /* ⚠ רווח קטן בין הקשתות · כמו בקנבס, כדי שהן לא יידבקו */
          const gap = 3;
          return (
            <Circle
              key={l.name}
              cx={37}
              cy={37}
              r={R}
              fill="none"
              stroke={l.color}
              strokeWidth={9}
              strokeDasharray={`${Math.max(0, seg - gap).toFixed(2)} ${(C - seg + gap).toFixed(2)}`}
              strokeDashoffset={offset.toFixed(2)}
              transform="rotate(-90 37 37)"
            />
          );
        })}
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

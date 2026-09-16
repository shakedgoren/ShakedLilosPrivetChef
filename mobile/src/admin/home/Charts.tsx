import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import Svg, {
  Circle,
  Defs,
  Ellipse,
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
 * לפי קטגוריה · **עוגה מוטה**.
 *
 * ⚠ **אינה מהקנבס** · שקד בחרה (15 בספטמבר 2026) מתוך חמש הצעות
 * עומק, וביקשה במפורש: בלי הכותרת ״לפי קטגוריה״, האחוזים **בתוך
 * הפרוסות** כדי שלא יברחו מהכרטיסייה, ומקרא בשתי שורות ממורכזות.
 *
 * ⚠ **העומק בנוי משכבות ולא מפילטר** · דופן (אליפסה תחתונה ומלבן
 * מחבר), גרדיאנט על כל פרוסה, וברק לבן רך. `feDropShadow` נוסה
 * וירד — הוא צייר כתם צל עגול על הפרוסות הבהירות.
 */
export type Share = { name: string; color: string; pct: number };

/**
 * גוון בהיר וכהה לכל פרוסה · מה שהופך שטח שטוח לגוף.
 *
 * ⚠ **היה כאן טבלת גוונים קבועה והיא נכשלה** · היא הוקשה לפי
 * ה-hex המדויק של ערכת לבנדר, בעוד שהשרת שולח את הגוונים של
 * מסכי הניהול (`#7B5CBC` וכו׳). אף מפתח לא התאים, הכול נפל
 * לברירת המחדל הסגולה, והעוגה יצאה חד־גונית. עכשיו הגוונים
 * נגזרים מהצבע עצמו — כל צבע שיגיע יעבוד, והמקרא תואם לפרוסה.
 */
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const shade = (hex: string, by: number): string => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => clamp(by > 0 ? c + (255 - c) * by : c * (1 + by));
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
/** בהיר ל-45% כלפי לבן, כהה ל-22% כלפי שחור */
const faceOf = (hex: string): [string, string] => [shade(hex, 0.45), shade(hex, -0.22)];

/** פרוסה צרה · הכתב קטן יותר ויוצא אל החלק הרחב שלה */
const NARROW = 14;

let pieSeq = 0;
const nextPieId = () => `pie${(pieSeq += 1)}`;

export function CategoryPie({ parts, width = 127, depth = 12 }: { parts: Share[]; width?: number; depth?: number }) {
  const id = React.useMemo(nextPieId, []);
  const cx = width / 2;
  const rx = width / 2 - 6;
  const ry = rx * 0.58;
  const cy = ry + 5;
  const height = cy + ry + depth + 4;

  const sum = parts.reduce((t, p) => t + p.pct, 0) || 1;
  let at = -Math.PI / 2;
  const wedges = parts.map((p) => {
    const span = (p.pct / sum) * 2 * Math.PI;
    const w = { p, a0: at, a1: at + span };
    at += span;
    return w;
  });

  const face = faceOf;
  const top = (a0: number, a1: number) => {
    const x0 = cx + rx * Math.cos(a0);
    const y0 = cy + ry * Math.sin(a0);
    const x1 = cx + rx * Math.cos(a1);
    const y1 = cy + ry * Math.sin(a1);
    const big = a1 - a0 > Math.PI ? 1 : 0;
    return `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${rx.toFixed(2)},${ry.toFixed(2)} 0 ${big} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
  };

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        {parts.map((p, i) => {
          const [lo, hi] = face(p.color);
          return (
            <LinearGradient key={p.name} id={`${id}g${i}`} x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor={lo} />
              <Stop offset="1" stopColor={hi} />
            </LinearGradient>
          );
        })}
      </Defs>

      {/* הצל · אליפסה רכה **מתחת** לעוגה בלבד, לא עליה */}
      <Ellipse cx={cx} cy={cy + ry + depth - 2} rx={rx * 0.92} ry={ry * 0.26} fill="#5A4A70" opacity={0.14} />

      {/* הדופן · רק החלק שנראה מלפנים */}
      {wedges.map((w, i) => {
        const s0 = Math.max(w.a0, 0);
        const s1 = Math.min(w.a1, Math.PI);
        if (s1 <= s0) return null;
        const x0 = cx + rx * Math.cos(s0);
        const y0 = cy + ry * Math.sin(s0);
        const x1 = cx + rx * Math.cos(s1);
        const y1 = cy + ry * Math.sin(s1);
        const big = s1 - s0 > Math.PI ? 1 : 0;
        return (
          <Path
            key={`w-${w.p.name}`}
            d={`M${x0.toFixed(2)},${y0.toFixed(2)} A${rx.toFixed(2)},${ry.toFixed(2)} 0 ${big} 1 ${x1.toFixed(2)},${y1.toFixed(2)} L${x1.toFixed(2)},${(y1 + depth).toFixed(2)} A${rx.toFixed(2)},${ry.toFixed(2)} 0 ${big} 0 ${x0.toFixed(2)},${(y0 + depth).toFixed(2)} Z`}
            fill={face(w.p.color)[1]}
          />
        );
      })}

      {/* פני העוגה */}
      {wedges.map((w, i) => (
        <Path
          key={`f-${w.p.name}`}
          d={top(w.a0, w.a1)}
          fill={`url(#${id}g${i})`}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={0.9}
        />
      ))}

      {/* ⚠ **הברק ירד** · אליפסה לבנה רכה על פני העוגה נראתה כמו
          חור מוזר באמצע ולא כמו אור. בקשה של שקד. */}

      {/* האחוזים · על מרכז המסה, ולכן תמיד בתוך הפרוסה */}
      {wedges.map((w) => {
        /* ⚠ קטגוריה באפס · אין מה לכתוב עליה */
        if (w.p.pct <= 0) return null;
        const small = w.p.pct < NARROW;
        const mid = (w.a0 + w.a1) / 2;
        const k = small ? 0.74 : 0.6;
        return (
          <SvgText
            key={`t-${w.p.name}`}
            x={cx + rx * k * Math.cos(mid)}
            y={cy + ry * k * Math.sin(mid) + 3.4}
            textAnchor="middle"
            fontSize={small ? 9 : 11}
            fontWeight="700"
            fill="#FFFFFF"
            stroke="rgba(80,64,110,0.3)"
            strokeWidth={small ? 1.6 : 2}
            strokeLinejoin="round"
          >
            {`${w.p.pct}%`}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export function CategoryDonut({ parts }: { parts: Share[] }) {
  return (
    <View style={s.donutBox}>
      <Svg width={74} height={74} viewBox="0 0 74 74">
        {parts.map((l) => (
          <Circle key={l.name} cx={37} cy={37} r={29} fill="none" stroke={l.color} strokeWidth={9} />
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
  ringPct: { fontSize: 17, fontWeight: '600', color: surface.ink },
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
  donutText: { fontSize: 15, fontWeight: '600', color: surface.ink },
});

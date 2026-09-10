import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Section } from '../../data/boxes';
import { Stepper } from '../../components/Stepper';
import { Check } from '../../icons';
import { a, hues, radius, space, surface } from '../../theme/tokens';
import { sumOf, type Picks } from './useBoxesOrder';
import { Photo } from '../../components/Photo';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

const ACCENT = hues.box;

/**
 * סעיף אחד מתוך מארז ספיישל · כל סוג מצויר לפי Boxes.dc.html.
 *
 * המידות, הצבעים והמרכוזים כאן הועתקו אחד לאחד מהמרקאפ. הגרסה
 * הקודמת בנתה כל סעיף מחדש בשפה של האפליקציה, ולכן המסך נראה
 * שונה לגמרי מהקנבס.
 */

/* בורר נבחר / לא נבחר · chip() בקנבס */
const SEL_BG = a(ACCENT.rgb, 0.1);
const SEL_BD = a(ACCENT.rgb, 0.42);
const IDLE_BG = 'rgba(255,255,255,0.7)';
const IDLE_BD = 'rgba(130,112,162,0.16)';
const chip = (on: boolean) => ({
  backgroundColor: on ? SEL_BG : IDLE_BG,
  borderColor: on ? SEL_BD : IDLE_BD,
});
const ink = (on: boolean) => ({ color: on ? ACCENT.deep : surface.inkSoft, fontWeight: on ? '600' : '400' } as const);

/* גווני הסטפר בתוך המארזים · המינוס אפור והפלוס ירוק, כמו בקנבס */
const ROW_TONE = {
  plusBg: a(ACCENT.rgb, 0.13),
  plusInk: ACCENT.deep,
  minusBg: 'rgba(130,112,162,0.09)',
  minusInk: '#6E6478',
  key: 26,
  glyph: 12,
} as const;
const COUNT_TONE = { ...ROW_TONE, key: 32, glyph: 13 } as const;

type Api = {
  picks: Picks;
  select: (id: string, v: string) => void;
  setText: (id: string, v: string) => void;
  setNumber: (id: string, v: number) => void;
  setQty: (id: string, name: string, v: number) => void;
};

type Props = { s: Section; api: Api; photos?: string[] };

export function SectionRenderer({ s, api, photos = [] }: Props) {
  /* סעיף מוסתר נפתח רק כשהבחירה שהוא תלוי בה נעשתה */
  if (s.when && api.picks[s.when.id] !== s.when.is) return null;

  switch (s.kind) {
    case 'title':
      return (
        <View style={st.titleRow}>
          <Text style={st.title}>{s.label}</Text>
          {s.cap != null && s.link ? (
            <Text style={st.hint}>
              {sumOf(api.picks[s.link])} מתוך {s.cap}
            </Text>
          ) : null}
        </View>
      );

    case 'note':
      return <Text style={[st.note, s.tight && st.noteTight]}>{s.label}</Text>;

    case 'price':
      return <Text style={st.price}>{s.label}</Text>;

    case 'fine':
      return <Text style={st.fine}>{s.label}</Text>;

    case 'images':
      return <Images s={s} photos={photos} />;

    case 'text':
      return (
        <TextInput
          value={api.picks[s.id!] ?? ''}
          onChangeText={(v) => api.setText(s.id!, v)}
          placeholder={s.ph}
          placeholderTextColor="#B3ABBD"
          multiline
          style={st.field}
        />
      );

    case 'stepper': {
      const v = api.picks[s.id!] ?? s.min ?? 0;
      return (
        <View style={st.stepperBox}>
          <Stepper
            value={v}
            min={s.min ?? 0}
            tone={COUNT_TONE}
            onChange={(n) => api.setNumber(s.id!, Math.max(s.min ?? 0, n))}
          />
          {s.unit ? <Text style={st.stepperUnit}>{s.unit}</Text> : null}
        </View>
      );
    }

    case 'grid':
    case 'hidden':
      return <Grid s={s} api={api} />;

    case 'chips':
      return <Chips s={s} api={api} />;

    case 'cards':
      return <Cards s={s} api={api} />;

    case 'pair':
      return <Pair s={s} api={api} />;

    case 'row':
    case 'count':
      return <Quantities s={s} api={api} />;

    default:
      return null;
  }
}

const optionName = (o: unknown) => (typeof o === 'string' ? o : (o as { n: string }).n);

/** תמונות המארז · שורה של מסגרות ברוחב שווה, הגובה מהסעיף */
function Images({ s, photos }: { s: Section; photos: string[] }) {
  const h = parseInt(s.h ?? '84px', 10);
  return (
    <View style={st.images}>
      {Array.from({ length: s.count ?? 1 }).map((_, i) => (
        <Photo key={i} name={photos[i]} rgb={ACCENT.rgb} style={[st.shot, { height: h }]} />
      ))}
    </View>
  );
}

/**
 * בחירה יחידה · עד שלוש אפשרויות בשורה אחת, מעבר לכך שתי עמודות.
 * `boxy` הופך את הגלולה למלבן, ו-`narrow` מצמצם ל-272 וממרכז.
 */
function Grid({ s, api }: { s: Section; api: Api }) {
  const opts: unknown[] = s.options ?? [];
  const cols = opts.length <= 3 ? opts.length : 2;
  const [w, setW] = React.useState(0);
  const cellW = w ? (w - GRID_GAP * (cols - 1)) / cols : undefined;

  return (
    <>
      {s.label && s.kind === 'hidden' ? <Text style={st.title}>{s.label}</Text> : null}
      <View
        style={[st.grid, s.narrow && st.narrow]}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {opts.map((o, i) => {
          const name = optionName(o);
          const sub = s.subs?.[i];
          const on = api.picks[s.id!] === name;
          return (
            <Pressable
              key={name}
              onPress={() => api.select(s.id!, name)}
              style={[st.gridCell, { width: cellW, borderRadius: s.boxy ? 18 : 999 }, chip(on)]}
            >
              <Text style={[st.gridText, ink(on)]}>{name}</Text>
              {sub ? <Text style={[st.gridText, ink(on)]}>{sub}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

/** גלולות בשורה זורמת · גובה 38, בלי שבירת שורה בתוך הגלולה */
function Chips({ s, api }: { s: Section; api: Api }) {
  const opts: unknown[] = s.options ?? [];
  return (
    <View style={st.chips}>
      {opts.map((o) => {
        const name = optionName(o);
        const on = api.picks[s.id!] === name;
        return (
          <Pressable key={name} onPress={() => api.select(s.id!, name)} style={[st.chip, chip(on)]}>
            <Text style={[st.chipText, ink(on)]} numberOfLines={1}>
              {name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * כרטיסי האירוע · תמונה שממלאת את הכרטיס, כיתוב על גרדיאנט ירוק
 * בתחתית, ועיגול וי בפינה כשהכרטיס נבחר. הכל מהקנבס.
 */
function Cards({ s, api }: { s: Section; api: Api }) {
  const opts = (s.options ?? []) as { n: string; d?: string; add?: number }[];
  const [w, setW] = React.useState(0);
  const cellW = w ? (w - CARD_GAP) / 2 : undefined;

  return (
    <View style={st.cards} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {opts.map((o) => {
        const on = api.picks[s.id!] === o.n;
        return (
          <Pressable
            key={o.n}
            onPress={() => api.select(s.id!, o.n)}
            style={[st.card, { width: cellW, borderColor: on ? SEL_BD : IDLE_BD }]}
          >
            {/* ⚠ בלי שם · בקנבס הכרטיס מציג מציין מקום מקווקו, כי
                לתמונות האירוע עדיין אין קבצים. Photo נופלת לשם לבד. */}
            <Photo rgb={ACCENT.rgb} style={st.cardShot} />
            <View style={st.cardFoot}>
              <Text style={st.cardName}>{o.n}</Text>
              {o.d ? <Text style={st.cardDesc}>{o.d}</Text> : null}
              <View style={st.addPill}>
                <Text style={st.addText}>{o.add ? `+${o.add} ש״ח ליח׳` : 'ללא תוספת'}</Text>
              </View>
            </View>
            {on ? (
              <View style={st.checkBadge}>
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** שתי אפשרויות זו לצד זו · שם ותיאור, שניהם ממורכזים */
function Pair({ s, api }: { s: Section; api: Api }) {
  const opts = (s.options ?? []) as { n: string; d?: string }[];
  const [w, setW] = React.useState(0);
  const cellW = w ? (w - PAIR_GAP) / 2 : undefined;

  return (
    <View style={st.pair} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {opts.map((o) => {
        const on = api.picks[s.id!] === o.n;
        return (
          <Pressable
            key={o.n}
            onPress={() => api.select(s.id!, o.n)}
            style={[st.pairCell, { width: cellW }, chip(on)]}
          >
            <Text style={[st.pairName, ink(on)]}>{o.n}</Text>
            {o.d ? <Text style={st.pairDesc}>{o.d}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * כמות לכל פריט · `row` הוא שלוש עמודות צרות (חלות), `count` הוא
 * שורות מלאות עם תיאור (סלטים). המכסה חוסמת פריטים חדשים.
 */
function Quantities({ s, api }: { s: Section; api: Api }) {
  const opts = (s.options ?? []) as (string | { n: string; d?: string })[];
  const cur: Record<string, number> = api.picks[s.id!] || {};
  const step = s.step ?? 1;
  const first = s.first ?? step;
  const used = sumOf(cur);
  const full = s.cap != null && used >= s.cap;
  const isRow = s.kind === 'row';

  const [w, setW] = React.useState(0);
  const cellW = isRow && w ? (w - ROW_GAP * 2) / 3 : undefined;

  const bump = (name: string, v: number, next: number) => {
    if (next > v) {
      if (full) return;
      api.setQty(s.id!, name, v === 0 ? first : v + step);
    } else {
      api.setQty(s.id!, name, v <= first ? 0 : v - step);
    }
  };

  return (
    <View
      style={isRow ? st.rowGrid : st.countList}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {opts.map((o) => {
        const name = optionName(o);
        const desc = typeof o === 'string' ? undefined : o.d;
        const v = cur[name] ?? 0;
        const on = v > 0;

        if (isRow) {
          return (
            <View key={name} style={[st.rowCell, { width: cellW }, chip(on)]}>
              <Text style={[st.rowName, ink(on)]} numberOfLines={1}>
                {name}
              </Text>
              <Stepper value={v} tone={ROW_TONE} maxed={full && v === 0} onChange={(n) => bump(name, v, n)} />
            </View>
          );
        }

        /* הפלוס בקצה ימין, המינוס בקצה שמאל, והכיתוב ביניהם · כמו בקנבס */
        return (
          <View key={name} style={[st.countRow, chip(on)]}>
            <Stepper
              value={v}
              wide
              tone={COUNT_TONE}
              maxed={full && v === 0}
              onChange={(n) => bump(name, v, n)}
              center={
                <View style={st.countText}>
                  <Text style={[st.countName, ink(on)]}>{name}</Text>
                  {desc ? <Text style={st.countDesc}>{desc}</Text> : null}
                  {on ? <Text style={st.countQty}>{s.unit ? `${v} ${s.unit}` : v}</Text> : null}
                </View>
              }
            />
          </View>
        );
      })}
    </View>
  );
}

/* המרווחים בין תאים · מהקנבס */
const GRID_GAP = 8;
const CARD_GAP = 10;
const PAIR_GAP = 9;
const ROW_GAP = 8;
/** רוחב מרבי לסעיף narrow · 272 בקנבס */
const NARROW = 272;

const st = StyleSheet.create({
  /* כותרת הסעיף · ממורכזת, עם רמז המכסה לצידה */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  title: { fontSize: 15.5, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  hint: { fontSize: 11.5, fontWeight: '400', color: ACCENT.hue },

  note: {
    fontSize: 12.5,
    fontWeight: '300',
    lineHeight: 20,
    color: surface.muted,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  noteTight: { marginTop: -4 },
  price: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 19,
    color: ACCENT.hue,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  fine: {
    fontSize: 11,
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: 16.5,
    color: '#9A93A6',
    textAlign: 'center',
    paddingHorizontal: 6,
  },

  images: { flexDirection: 'row', gap: GRID_GAP },
  shot: { flex: 1, borderRadius: radius.field, overflow: 'hidden' },

  field: {
    minHeight: 68,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    textAlign: 'right',
    textAlignVertical: 'top',
    color: surface.ink,
  },

  /* הסטפר הבודד · לוח זכוכית ממורכז, כמו בקנבס */
  stepperBox: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: IDLE_BG,
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
  },
  stepperUnit: { fontSize: 12.5, color: surface.muted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: GRID_GAP },
  narrow: { maxWidth: NARROW, alignSelf: 'center' },
  gridCell: {
    minHeight: 44,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  gridText: { fontSize: 12.5, textAlign: 'center', lineHeight: 15.6 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 2 },
  chip: {
    height: 38,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chipText: { fontSize: 12.5 },

  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  card: { height: 208, borderRadius: 20, overflow: 'hidden', borderWidth: 2, backgroundColor: IDLE_BG },
  cardShot: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  /* כיתוב על גרדיאנט ירוק בתחתית · הערכים מהקנבס */
  cardFoot: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    paddingTop: 26,
    paddingHorizontal: 10,
    paddingBottom: 11,
    backgroundColor: 'rgba(198,228,211,0.93)',
    alignItems: 'center',
    gap: 3,
  },
  cardName: { fontSize: 13, fontWeight: '600', color: '#22452F', lineHeight: 15.6, textAlign: 'center' },
  cardDesc: { fontSize: 10, fontWeight: '300', lineHeight: 14.5, color: '#37634A', textAlign: 'center' },
  addPill: {
    marginTop: 2,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  addText: { fontSize: 10, fontWeight: '600', color: '#22452F' },
  checkBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT.hue,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px -2px rgba(44,90,62,0.7)',
  },

  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: PAIR_GAP },
  pairCell: {
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pairName: { fontSize: 13.5, lineHeight: 17.5, textAlign: 'center' },
  pairDesc: { fontSize: 12, lineHeight: 15.6, color: surface.muted, textAlign: 'center' },

  rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ROW_GAP },
  rowCell: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    gap: 6,
  },
  rowName: { fontSize: 12.5 },

  countList: { gap: GRID_GAP },
  countRow: { borderRadius: 18, borderWidth: 1.5, padding: 10 },
  countText: { flex: 1, minWidth: 0, alignItems: 'center', gap: 3, paddingHorizontal: GRID_GAP },
  countName: { fontSize: 13.5, lineHeight: 17, textAlign: 'center' },
  countDesc: { fontSize: 11, fontWeight: '300', lineHeight: 16, color: surface.muted, textAlign: 'center' },
  countQty: { fontSize: 13, fontWeight: '700', color: ACCENT.deep },
});

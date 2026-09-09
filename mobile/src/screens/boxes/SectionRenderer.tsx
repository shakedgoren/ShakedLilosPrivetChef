import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Section } from '../../data/boxes';
import { Stepper } from '../../components/Stepper';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { sumOf, type Picks } from './useBoxesOrder';
import { Photo } from '../../components/Photo';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

const ACCENT = hues.box;

type Api = {
  picks: Picks;
  select: (id: string, v: string) => void;
  setText: (id: string, v: string) => void;
  setNumber: (id: string, v: number) => void;
  setQty: (id: string, name: string, v: number) => void;
};

/** מצייר סעיף אחד מתוך המארז · כל סוגי הסעיפים שהקנבס מגדיר */
export function SectionRenderer({
  s,
  api,
  photos = [],
}: {
  s: Section;
  api: Api;
  /** גלריית המארז הפתוח · סעיף images שואב ממנה לפי הסדר */
  photos?: string[];
}) {
  /* סעיף מוסתר נפתח רק כשהבחירה שהוא תלוי בה נעשתה */
  if (s.when && api.picks[s.when.id] !== s.when.is) return null;

  switch (s.kind) {
    case 'title':
      return (
        <View style={st.titleRow}>
          <Text style={st.title}>{s.label}</Text>
          {s.cap != null && s.link ? (
            <Text style={st.cap}>
              {sumOf(api.picks[s.link])} / {s.cap}
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
      return (
        <View style={st.images}>
          {Array.from({ length: s.count ?? 1 }).map((_, i) => (
            <Photo
              key={i}
              name={photos[i]}
              rgb={ACCENT.rgb}
              style={[st.shot, { height: parseInt(s.h ?? '84px', 10) }]}
            />
          ))}
        </View>
      );

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
        <View style={st.stepperRow}>
          <Text style={st.stepperUnit}>{s.unit}</Text>
          <View style={st.grow} />
          <Stepper
            value={v}
            min={s.min ?? 0}
            onChange={(n) => api.setNumber(s.id!, Math.max(s.min ?? 0, n))}
          />
        </View>
      );
    }

    /* בחירה יחידה · גריד קומפקטי, זוג עם תיאור, קלפים, ומוסתר */
    case 'grid':
    case 'hidden':
      return <Chips s={s} api={api} />;

    case 'pair':
    case 'cards':
      return <Cards s={s} api={api} />;

    /* כמות לכל פריט · חלות (row) וסלטים (count) */
    case 'row':
    case 'count':
      return <Quantities s={s} api={api} />;

    default:
      return null;
  }
}

const optionName = (o: unknown) => (typeof o === 'string' ? o : (o as { n: string }).n);

function Chips({ s, api }: { s: Section; api: Api }) {
  const opts: unknown[] = s.options ?? [];
  return (
    <>
      {s.label && s.kind === 'hidden' ? <Text style={st.title}>{s.label}</Text> : null}
      <View style={st.chips}>
        {opts.map((o, i) => {
          const name = optionName(o);
          const sub = s.subs?.[i];
          const on = api.picks[s.id!] === name;
          return (
            <Pressable
              key={name}
              onPress={() => api.select(s.id!, name)}
              style={[st.chip, on && st.chipOn]}
            >
              <Text style={[st.chipText, on && st.chipTextOn]}>{name}</Text>
              {sub ? <Text style={st.chipSub}>{sub}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function Cards({ s, api }: { s: Section; api: Api }) {
  const opts = (s.options ?? []) as { n: string; d?: string }[];
  return (
    <View style={st.cards}>
      {opts.map((o) => {
        const on = api.picks[s.id!] === o.n;
        return (
          <Pressable key={o.n} onPress={() => api.select(s.id!, o.n)} style={[st.card, on && st.chipOn]}>
            <Text style={[st.cardName, on && st.chipTextOn]}>{o.n}</Text>
            {o.d ? <Text style={st.cardDesc}>{o.d}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function Quantities({ s, api }: { s: Section; api: Api }) {
  const opts = (s.options ?? []) as (string | { n: string; d?: string })[];
  const cur: Record<string, number> = api.picks[s.id!] || {};
  const step = s.step ?? 1;
  const first = s.first ?? step;
  const used = sumOf(cur);
  const full = s.cap != null && used >= s.cap;

  return (
    <View style={st.qtyList}>
      {opts.map((o) => {
        const name = optionName(o);
        const desc = typeof o === 'string' ? undefined : o.d;
        const v = cur[name] ?? 0;
        const blocked = full && v === 0;
        return (
          <View key={name} style={[st.qtyRow, blocked && st.qtyBlocked]}>
            <View style={st.grow}>
              <Text style={st.qtyName}>{name}</Text>
              {desc ? (
                <Text style={st.qtyDesc} numberOfLines={2}>
                  {desc}
                </Text>
              ) : null}
              {v > 0 && s.unit ? <Text style={st.qtyValue}>{`${v} ${s.unit}`}</Text> : null}
            </View>
            <Stepper
              value={v}
              onChange={(next) => {
                /* המעבר מ-0 קופץ למינימום ההזמנה, ומשם בקפיצות קבועות */
                if (next > v) {
                  if (s.cap != null && used >= s.cap) return;
                  api.setQty(s.id!, name, v === 0 ? first : v + step);
                } else {
                  api.setQty(s.id!, name, v <= first ? 0 : v - step);
                }
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.md },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: surface.ink },
  cap: { fontSize: type.label, fontWeight: '600', color: ACCENT.deep },
  note: { fontSize: 12.5, color: surface.muted, lineHeight: 18 },
  noteTight: { marginTop: -4 },
  price: { fontSize: 12.5, fontWeight: '600', color: ACCENT.deep },
  fine: { fontSize: 11, color: surface.faint },

  images: { flexDirection: 'row', gap: space.sm },
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

  stepperRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  stepperUnit: { fontSize: type.label, color: surface.muted },
  grow: { flex: 1 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  chip: {
    minWidth: 96,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 2,
  },
  chipOn: { borderColor: a(ACCENT.rgb, 0.42), backgroundColor: a(ACCENT.rgb, 0.1) },
  chipText: { fontSize: 14, color: surface.inkSoft },
  chipTextOn: { color: ACCENT.deep, fontWeight: '600' },
  chipSub: { fontSize: 11, color: surface.muted },

  cards: { gap: space.sm },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 13,
    gap: 3,
  },
  cardName: { fontSize: 14.5, fontWeight: '500', color: surface.ink },
  cardDesc: { fontSize: 12, color: surface.muted, lineHeight: 17 },

  qtyList: { gap: space.sm },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 12,
  },
  qtyBlocked: { opacity: 0.4 },
  qtyName: { fontSize: 14.5, fontWeight: '500', color: surface.ink },
  qtyDesc: { fontSize: 11.5, color: surface.muted, lineHeight: 16, marginTop: 2 },
  qtyValue: { fontSize: 12, fontWeight: '600', color: ACCENT.deep, marginTop: 2 },
});

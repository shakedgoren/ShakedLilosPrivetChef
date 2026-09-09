import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ChefSection } from '../../data/chef';
import { Photo } from '../../components/Photo';
import { Stepper } from '../../components/Stepper';
import { isMissingPhoto } from '../../data/photos';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import type { Picks } from './useChefOrder';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

const ACCENT = hues.chef;

type Api = {
  picks: Picks;
  select: (id: string, v: string) => void;
  toggle: (id: string, v: string, cap?: number | null) => void;
  setValue: (id: string, v: unknown) => void;
  stylesFor: (concept: string) => string[];
};

const nameOf = (o: unknown) => (typeof o === 'string' ? o : (o as { n: string }).n);
const descOf = (o: unknown) => (typeof o === 'string' ? undefined : (o as { d?: string }).d);

/** מצייר סעיף אחד מתוך שאלון השף · כל 17 סוגי הסעיפים שהקנבס מגדיר */
export function ChefSectionRenderer({ s, api }: { s: ChefSection; api: Api }) {
  if (s.when && api.picks[s.when.id] !== s.when.is) return null;

  switch (s.kind) {
    case 'head':
      return (
        <View style={st.headRow}>
          <Text style={st.head}>{s.label}</Text>
          {s.cap != null && s.link ? (
            <Text style={st.cap}>
              {(api.picks[s.link] || []).length} / {s.cap}
            </Text>
          ) : null}
        </View>
      );

    case 'title':
      return (
        <View style={st.titleRow}>
          <Text style={st.title}>{s.label}</Text>
          {s.cap != null && s.link ? (
            <Text style={st.cap}>
              {(api.picks[s.link] || []).length} / {s.cap}
            </Text>
          ) : null}
        </View>
      );

    case 'note':
      return <Text style={[st.note, s.tight && st.tight]}>{s.label}</Text>;

    case 'fine':
      return <Text style={st.fine}>{s.label}</Text>;

    case 'gap':
      return <View style={st.gap} />;

    case 'text':
      return (
        <TextInput
          value={api.picks[s.id] ?? ''}
          onChangeText={(v) => api.setValue(s.id, v)}
          placeholder={s.ph}
          placeholderTextColor="#B3ABBD"
          multiline
          style={st.field}
        />
      );

    case 'addr':
      return (
        <TextInput
          value={api.picks[s.id] ?? ''}
          onChangeText={(v) => api.setValue(s.id, v)}
          placeholder={s.ph ?? 'כתובת האירוע'}
          placeholderTextColor="#B3ABBD"
          style={[st.field, st.oneLine]}
        />
      );

    case 'cal':
      return (
        <TextInput
          value={api.picks[s.id] ?? ''}
          onChangeText={(v) => api.setValue(s.id, v)}
          placeholder="תאריך האירוע · למשל 12.9"
          placeholderTextColor="#B3ABBD"
          style={[st.field, st.oneLine]}
        />
      );

    case 'pairtext':
      return (
        <View style={st.pairText}>
          {(s.ids as string[]).map((id, i) => (
            <View key={id} style={st.grow}>
              <Text style={st.smallLabel}>{s.labels?.[i]}</Text>
              <TextInput
                value={api.picks[id] ?? ''}
                onChangeText={(v) => api.setValue(id, v)}
                placeholder={s.phs?.[i]}
                placeholderTextColor="#B3ABBD"
                style={[st.field, st.oneLine]}
              />
            </View>
          ))}
        </View>
      );

    case 'stepper': {
      const v = api.picks[s.id] ?? s.min ?? 0;
      return (
        <View style={st.stepperRow}>
          <Text style={st.stepperUnit}>{s.unit}</Text>
          <View style={st.grow} />
          <Stepper
            value={v}
            min={s.min ?? 0}
            onChange={(n) => {
              const step = s.step ?? 1;
              const raw = n > v ? v + step : v - step;
              const lo = s.min ?? 0;
              const hi = s.max ?? Number.MAX_SAFE_INTEGER;
              api.setValue(s.id, Math.max(lo, Math.min(hi, raw)));
            }}
          />
        </View>
      );
    }

    /* בחירה יחידה · הסגנונות מסתננים לפי הציר שנבחר */
    case 'grid':
    case 'tiers':
    case 'pair': {
      let opts: unknown[] = s.options ?? [];
      /* הסגנונות הזמינים תלויים בציר · בשרי פותח את כולם */
      if (s.id === 'style') {
        const allowed = api.stylesFor(api.picks.concept);
        opts = opts.filter((o) => allowed.includes(nameOf(o)));
      }
      /* סעיף נעול · נפתח רק אחרי שהבחירה שהוא תלוי בה נעשתה */
      const locked = !!s.lock && !api.picks[s.lock];
      const boxy = s.kind !== 'pair';
      return (
        <View style={[boxy ? st.chips : st.cards, locked && st.blocked]} pointerEvents={locked ? 'none' : 'auto'}>
          {opts.map((o) => {
            const n = nameOf(o);
            const d = descOf(o);
            const on = api.picks[s.id] === n;
            return (
              <Pressable
                key={n}
                onPress={() => api.select(s.id, n)}
                style={[boxy ? st.chip : st.card, on && st.on]}
              >
                <Text style={[boxy ? st.chipText : st.cardName, on && st.onText]}>{n}</Text>
                {d ? <Text style={st.cardDesc}>{d}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      );
    }

    /* בחירה מרובה · עם מכסה או בלי */
    case 'multi':
    case 'multicap':
    case 'sauces':
    case 'cards': {
      const opts: unknown[] = s.options ?? [];
      const cur: string[] = api.picks[s.id] || [];
      const cap = s.cap ?? null;
      const full = cap != null && cur.length >= cap;
      const asCards = s.kind === 'cards';
      return (
        <>
          {s.note ? <Text style={st.note}>{s.note}</Text> : null}
          <View style={asCards ? st.cards : st.chips}>
            {opts.map((o) => {
              const n = nameOf(o);
              const d = descOf(o);
              const on = cur.includes(n);
              const blocked = full && !on;
              const missing = isMissingPhoto(n);
              return (
                <Pressable
                  key={n}
                  onPress={() => api.toggle(s.id, n, cap)}
                  style={[asCards ? st.card : st.chip, on && st.on, blocked && st.blocked, missing && st.missingRow]}
                >
                  {missing ? <Photo rgb={ACCENT.rgb} style={st.missingShot} /> : null}
                  <View style={missing ? st.grow : undefined}>
                    <Text style={[asCards ? st.cardName : st.chipText, on && st.onText]}>{n}</Text>
                    {d ? <Text style={st.cardDesc}>{d}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      );
    }

    default:
      return null;
  }
}

const st = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.lg },
  head: { flex: 1, fontSize: 17, fontWeight: '600', color: surface.ink },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.md },
  title: { flex: 1, fontSize: 14.5, fontWeight: '600', color: surface.ink },
  cap: { fontSize: type.label, fontWeight: '600', color: ACCENT.deep },
  note: { fontSize: 12.5, color: surface.muted, lineHeight: 18 },
  tight: { marginTop: -4 },
  fine: { fontSize: 11, color: surface.faint },
  gap: { height: space.md },

  field: {
    minHeight: 64,
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
  oneLine: { minHeight: 46, paddingVertical: 12 },
  pairText: { flexDirection: 'row', gap: space.sm },
  smallLabel: { fontSize: 11.5, color: surface.faint, marginBottom: 4 },
  grow: { flex: 1 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  stepperUnit: { fontSize: type.label, color: surface.muted },

  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  chip: {
    minWidth: 92,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  chipText: { fontSize: 13.5, color: surface.inkSoft, textAlign: 'center' },

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

  on: { borderColor: a(ACCENT.rgb, 0.42), backgroundColor: a(ACCENT.rgb, 0.1) },
  onText: { color: ACCENT.deep, fontWeight: '600' },
  blocked: { opacity: 0.4 },
  missingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  missingShot: { width: 58, height: 58, borderRadius: radius.field, overflow: 'hidden' },
});

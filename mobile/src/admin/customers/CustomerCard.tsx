import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import {
  CALL_LABEL,
  DETAIL_KEYS,
  HIST_LABEL,
  HUES,
  NOTE_LABEL,
  NOTE_PLACEHOLDER,
  ORDER_LABEL,
  TAG_NEW,
  TAG_REGULAR,
  type Person,
} from '../../data/adminCustomers';
import { Field } from '../ui/Field';
import { nf } from '../shopping/useAdminShopping';
import { isRegular } from './useAdminCustomers';

type Props = {
  person: Person;
  note: string;
  isOpen: boolean;
  onToggle: () => void;
  onNote: (v: string) => void;
  onHist: () => void;
};

export function CustomerCard({ person, note, isOpen, onToggle, onNote, onHist }: Props) {
  const reg = isRegular(person);
  const rows = [
    { k: DETAIL_KEYS[0], v: person.phone },
    { k: DETAIL_KEYS[1], v: person.addr },
    { k: DETAIL_KEYS[2], v: person.last },
    { k: DETAIL_KEYS[3], v: `${nf(person.spent / person.orders)} ₪` },
  ];

  return (
    <View style={s.card}>
      <Pressable onPress={onToggle} style={s.head}>
        <View
          style={[
            s.avatar,
            { backgroundColor: reg ? 'rgba(123,92,188,0.14)' : 'rgba(130,112,162,0.1)' },
          ]}
        >
          <Text style={[s.initial, { color: reg ? '#43307A' : surface.faint }]}>
            {person.name.charAt(0)}
          </Text>
        </View>

        <View style={s.main}>
          <View style={s.nameRow}>
            <Text style={s.name}>{person.name}</Text>
            <View
              style={[
                s.tag,
                { backgroundColor: reg ? 'rgba(78,138,100,0.14)' : 'rgba(123,92,188,0.12)' },
              ]}
            >
              <Text style={[s.tagText, { color: reg ? '#4E8A64' : '#43307A' }]}>
                {reg ? TAG_REGULAR : TAG_NEW}
              </Text>
            </View>
          </View>
          <Text style={s.line}>{`${person.orders} הזמנות · לקוחה מאז ${person.since}`}</Text>
          {note ? (
            <Text numberOfLines={1} style={s.noteFlag}>
              {note}
            </Text>
          ) : null}
        </View>

        <View style={s.side}>
          <Text style={s.spent}>{`${nf(person.spent)} ₪`}</Text>
          <Text style={s.spentTag}>סה״כ</Text>
        </View>
        <Text style={s.chev}>{isOpen ? '⌃' : '⌄'}</Text>
      </Pressable>

      {isOpen ? (
        <View style={s.body}>
          <View style={s.rule} />

          {rows.map((r) => (
            <View key={r.k} style={s.row}>
              <Text style={s.rowKey}>{r.k}</Text>
              <Text style={s.rowVal}>{r.v}</Text>
            </View>
          ))}

          <View style={s.likes}>
            {person.likes.map((k) => (
              <View key={k} style={[s.like, { backgroundColor: `rgba(${HUES[k].rgb},0.12)` }]}>
                <Text style={[s.likeText, { color: HUES[k].deep }]}>{HUES[k].n}</Text>
              </View>
            ))}
          </View>

          <Field
            label={NOTE_LABEL}
            value={note}
            onChange={onNote}
            placeholder={NOTE_PLACEHOLDER}
            height={44}
          />

          <Pressable onPress={onHist} style={s.wideBtn}>
            <Text style={s.btnText}>{HIST_LABEL}</Text>
          </Pressable>

          <View style={s.btnRow}>
            <View style={s.btn}>
              <Text style={s.btnText}>{CALL_LABEL}</Text>
            </View>
            <View style={s.btn}>
              <Text style={s.btnText}>{ORDER_LABEL}</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 15, fontWeight: '700' },
  main: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 15, fontWeight: '600', color: surface.ink },
  tag: { borderRadius: 7, paddingVertical: 1, paddingHorizontal: 7 },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  line: { fontSize: 11.5, fontWeight: '300', color: surface.faint, marginTop: 2 },
  noteFlag: { fontSize: 11, fontWeight: '500', color: '#A65E2A', marginTop: 2 },
  side: { alignItems: 'flex-end' },
  spent: { fontSize: 14.5, fontWeight: '600', color: surface.ink },
  spentTag: { fontSize: 10.5, fontWeight: '300', color: surface.faint },
  chev: { fontSize: 14, color: '#A79FB2' },

  body: { gap: 10 },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.14)' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowKey: { width: 82, fontSize: 11.5, fontWeight: '300', color: surface.muted, lineHeight: 18 },
  rowVal: { flex: 1, fontSize: 12.5, fontWeight: '500', color: surface.ink, lineHeight: 18 },
  likes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  like: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9 },
  likeText: { fontSize: 11, fontWeight: '600' },

  wideBtn: {
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', gap: 7 },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 12.5, fontWeight: '600', color: surface.inkSoft },
});

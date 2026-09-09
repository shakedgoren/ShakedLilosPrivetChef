import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { surface } from '../theme/tokens';
import { count as plural } from '../text/counts';
import {
  CALL_LABEL,
  CUSTOMERS_TITLE,
  EMPTY_CUSTOMER,
  FILTERS,
  HIST_LABEL,
  NOTE_LABEL,
  NOTE_PH,
  ORDER_LABEL,
  PEOPLE,
  PEOPLE_HUES,
  REGULAR_MIN,
  SEARCH_PH,
  SPENT_TAG,
  TAG_NEW,
  TAG_REG,
  type DemoPerson,
} from '../data/adminCustomers';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { Sheet } from './ui/Sheet';
import { apiEnabled } from '../api/config';
import { adminListCustomers, adminPatchCustomer } from '../api/admin';
import type { AdminCustomer } from '../api/types';
import { useNav } from '../navigation/store';
import type { AdminCatKey } from '../data/adminOrders';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };
const norm = (v: string) => String(v || '').replace(/[-\s]/g, '').replace(/^\+972/, '0');

type Row = {
  id?: string;
  name: string;
  phone: string;
  addr: string;
  since: string;
  orders: number;
  spent: number;
  last: string;
  likes: string[];
  note: string;
  history: { id?: string; d: string; k: string; t: string; v: number; s: string }[];
};

const fromDemo = (p: DemoPerson): Row => ({
  name: p.name,
  phone: p.phone,
  addr: p.addr,
  since: p.since,
  orders: p.orders,
  spent: p.spent,
  last: p.last,
  likes: p.likes,
  note: p.note,
  history: [],
});

export function AdminCustomersScreen() {
  const { user, go } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'reg' | 'new'>('all');
  const [open, setOpen] = useState(-1);
  const [hist, setHist] = useState<Row | null>(null);
  const [rows, setRows] = useState<Row[]>(() => PEOPLE.map(fromDemo));

  const reload = useCallback(async () => {
    if (!live) return;
    const { customers } = await adminListCustomers();
    setRows(
      customers.map((c: AdminCustomer) => ({
        id: c.id,
        name: c.name,
        phone: c.phone ?? '',
        addr: [c.address, c.city].filter(Boolean).join(', '),
        since: c.since,
        orders: c.orders,
        spent: c.spent,
        last: c.last,
        likes: c.likes,
        note: c.note ?? '',
        history: c.history,
      })),
    );
  }, [live]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const isReg = (p: Row) => p.orders >= REGULAR_MIN;
  const shown = rows.filter((p) => {
    if (filter === 'reg' && !isReg(p)) return false;
    if (filter === 'new' && isReg(p)) return false;
    if (!q.trim()) return true;
    return p.name.includes(q) || norm(p.phone).includes(norm(q));
  });

  const count = (f: typeof filter) =>
    rows.filter((p) => (f === 'all' ? true : f === 'reg' ? isReg(p) : !isReg(p))).length;

  const setNote = (i: number, note: string) => {
    setRows((list) => list.map((r, k) => (k === i ? { ...r, note } : r)));
    const row = rows[i];
    if (live && row?.id) void adminPatchCustomer(row.id, note).catch(() => undefined);
  };

  const spentAll = rows.reduce((s, p) => s + p.spent, 0);

  return (
    <AdminShell title={CUSTOMERS_TITLE} sub={`${rows.length} לקוחות · ${nf(spentAll)} ₪ מצטבר`}>
      <View style={s.searchWrap}>
        <TextInput
          value={q}
          onChangeText={(v) => {
            setQ(v);
            setOpen(-1);
          }}
          placeholder={SEARCH_PH}
          placeholderTextColor="#B3ABBD"
          style={s.search}
        />
      </View>
      <View style={s.tabs}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.n}
            on={filter === f.id}
            tint={PLUM}
            style={s.tab}
            count={count(f.id)}
            onPress={() => {
              setFilter(f.id);
              setOpen(-1);
            }}
          />
        ))}
      </View>
      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {shown.length === 0 ? (
          <Text style={s.empty}>{EMPTY_CUSTOMER}</Text>
        ) : (
          shown.map((p) => {
            const i = rows.indexOf(p);
            const reg = isReg(p);
            const isOpen = open === i;
            return (
              <View key={`${p.phone}-${i}`} style={s.card}>
                <Pressable onPress={() => setOpen(isOpen ? -1 : i)} style={s.top}>
                  <View style={[s.av, { backgroundColor: reg ? 'rgba(123,92,188,0.14)' : 'rgba(130,112,162,0.1)' }]}>
                    <Text style={[s.initial, { color: reg ? '#43307A' : '#8A8194' }]}>{p.name.charAt(0)}</Text>
                  </View>
                  <View style={s.main}>
                    <View style={s.nameRow}>
                      <Text style={s.name}>{p.name}</Text>
                      <View style={[s.tag, { backgroundColor: reg ? 'rgba(78,138,100,0.14)' : 'rgba(123,92,188,0.12)' }]}>
                        <Text style={[s.tagText, { color: reg ? '#4E8A64' : '#43307A' }]}>{reg ? TAG_REG : TAG_NEW}</Text>
                      </View>
                    </View>
                    <Text style={s.line}>{`${plural(p.orders, 'הזמנה אחת', 'הזמנות')} · לקוחה מאז ${p.since}`}</Text>
                    {p.note ? <Text style={s.noteFlag} numberOfLines={1}>{p.note}</Text> : null}
                  </View>
                  <View>
                    <Text style={s.spent}>{`${nf(p.spent)} ₪`}</Text>
                    <Text style={s.spentTag}>{SPENT_TAG}</Text>
                  </View>
                </Pressable>
                {isOpen ? (
                  <View style={s.more}>
                    {[
                      { k: 'טלפון', v: p.phone },
                      { k: 'כתובת', v: p.addr },
                      { k: 'הזמנה אחרונה', v: p.last },
                      { k: 'ממוצע להזמנה', v: p.orders ? `${nf(p.spent / p.orders)} ₪` : '—' },
                    ].map((r) => (
                      <View key={r.k} style={s.row}>
                        <Text style={s.rowK}>{r.k}</Text>
                        <Text style={s.rowV}>{r.v}</Text>
                      </View>
                    ))}
                    <View style={s.likes}>
                      {p.likes.map((k) => {
                        const h = PEOPLE_HUES[k as AdminCatKey];
                        if (!h) return null;
                        return (
                          <View key={k} style={[s.like, { backgroundColor: `rgba(${h.rgb},0.12)` }]}>
                            <Text style={[s.likeText, { color: h.deep }]}>{h.n}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={s.noteLab}>{NOTE_LABEL}</Text>
                    <TextInput
                      value={p.note}
                      onChangeText={(v) => setNote(i, v)}
                      placeholder={NOTE_PH}
                      placeholderTextColor="#B3ABBD"
                      style={s.noteInput}
                    />
                    <View style={s.acts}>
                      <Pressable onPress={() => setHist(p)} style={s.act}>
                        <Text style={s.actText}>{HIST_LABEL}</Text>
                      </Pressable>
                      <View style={s.act}>
                        <Text style={s.actText}>{CALL_LABEL}</Text>
                      </View>
                      <Pressable onPress={() => go('adminOrders')} style={[s.act, s.actGo]}>
                        <Text style={s.actGoText}>{ORDER_LABEL}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
      {hist ? (
        <Sheet title={`ההזמנות של ${hist.name}`} sub={plural(hist.history.length, 'הזמנה אחת', 'הזמנות')} onClose={() => setHist(null)}>
          <ScrollView style={{ maxHeight: 360 }}>
            {(hist.history.length ? hist.history : [{ d: hist.last, k: hist.likes[0] ?? 'cous', t: hist.last, v: hist.spent, s: 'נמסרה' }]).map((h, i) => (
              <View key={h.id ?? i} style={s.histRow}>
                <Text style={s.histK}>{h.d}</Text>
                <Text style={s.histT}>{h.t}</Text>
                <Text style={s.histV}>{`${h.v} ₪ · ${h.s}`}</Text>
              </View>
            ))}
          </ScrollView>
        </Sheet>
      ) : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  searchWrap: {},
  search: {
    height: 46,
    borderRadius: 15,
    paddingHorizontal: 13,
    fontSize: 13.5,
    color: surface.ink,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
    textAlign: 'right',
  },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1 },
  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },
  empty: { fontSize: 14, fontWeight: '500', color: '#A79FB2', textAlign: 'center', marginTop: 60 },
  card: {
    borderRadius: 20,
    padding: 13,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    gap: 11,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  av: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 15, fontWeight: '700' },
  main: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 15, fontWeight: '600', color: surface.ink },
  tag: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 1 },
  tagText: { fontSize: 10, fontWeight: '700' },
  line: { fontSize: 11.5, color: surface.faint, marginTop: 2 },
  noteFlag: { fontSize: 11, fontWeight: '500', color: '#A65E2A', marginTop: 4 },
  spent: { fontSize: 14.5, fontWeight: '600', color: surface.ink, textAlign: 'left' },
  spentTag: { fontSize: 10.5, color: '#A79FB2', textAlign: 'left' },
  more: { gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(130,112,162,0.14)', paddingTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowK: { fontSize: 12, color: surface.faint },
  rowV: { fontSize: 12.5, color: surface.ink, flex: 1, textAlign: 'left' },
  likes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  like: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  likeText: { fontSize: 11, fontWeight: '600' },
  noteLab: { fontSize: 11.5, fontWeight: '500', color: surface.faint },
  noteInput: {
    height: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
    fontSize: 12.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
    textAlign: 'right',
    color: surface.ink,
  },
  acts: { flexDirection: 'row', gap: 8 },
  act: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.22)',
  },
  actGo: { backgroundColor: '#C6B3EC', borderColor: 'transparent' },
  actText: { fontSize: 12, fontWeight: '600', color: '#43307A' },
  actGoText: { fontSize: 12, fontWeight: '600', color: '#43307A' },
  histRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(130,112,162,0.12)', gap: 2 },
  histK: { fontSize: 11, color: surface.faint },
  histT: { fontSize: 13, color: surface.ink },
  histV: { fontSize: 12, color: '#6E6478' },
});

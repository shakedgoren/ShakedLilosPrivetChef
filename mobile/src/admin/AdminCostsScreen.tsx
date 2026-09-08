import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  COST_CATS,
  COST_DISHES,
  COST_PANTRY,
  COSTS_AUTO_TAG,
  COSTS_COLS,
  COSTS_DUE_SUB,
  COSTS_DUE_TITLE,
  COSTS_FOOT,
  COSTS_FROM_LABEL,
  COSTS_IMP_NONE,
  COSTS_IMP_SUB,
  COSTS_IMP_TITLE,
  COSTS_IMPORT,
  COST_MONTHS,
  COSTS_PACK_TITLE,
  COSTS_PARTS_TITLE,
  COSTS_PART_PH,
  COSTS_PRICE_KG,
  COSTS_PRICE_UNIT,
  COSTS_TITLE,
  COSTS_YIELD_UNIT,
  COSTS_YIELD_WEIGHT,
  type CostDish,
  type CostPart,
} from '../data/adminCosts';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { Sheet } from './ui/Sheet';
import { apiEnabled } from '../api/config';
import { adminCosts, adminImportCosts, adminPutCost, adminShopHistory } from '../api/admin';
import { useNav } from '../navigation/store';

const num = (v: string | number) => {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};
const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const money = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

type Dish = CostDish & { parts: CostPart[] };

function partsSum(d: Dish) {
  return d.parts.reduce((s, p) => s + num(p.price) * num(p.qty), 0);
}

function unitCost(d: Dish, all: Dish[], depth = 0): number {
  if (depth > 4) return 0;
  let base = 0;
  for (const f of d.from) {
    if (f.id === 'salads:avg') {
      const salads = all.filter((x) => x.sub === 'salads');
      const avg = salads.length ? salads.reduce((s, x) => s + unitCost(x, all, 3), 0) / salads.length : 0;
      base += avg * f.m;
      continue;
    }
    const src = all.find((x) => x.id === f.id);
    if (src) base += unitCost(src, all, depth + 1) * f.m;
  }
  const own = partsSum(d);
  const y = num(d.yld);
  if (d.mode === 'weight') return y > 0 ? own / (y / 100) : 0;
  if (own > 0 && y > 0) base += own / y;
  else if (own > 0 && y === 0) base += own;
  return base;
}

export function AdminCostsScreen() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [cat, setCat] = useState('cous');
  const [sub, setSub] = useState('salads');
  const [open, setOpen] = useState(-1);
  const [seen, setSeen] = useState(false);
  const [impOpen, setImpOpen] = useState(false);
  const [impDone, setImpDone] = useState('');
  const [dishes, setDishes] = useState<Dish[]>(() => COST_DISHES.map((d) => ({ ...d, parts: d.parts.map((p) => ({ ...p })) })));
  const [buys, setBuys] = useState<{ id: string; title: string }[]>([]);

  const reload = useCallback(async () => {
    if (!live) return;
    const r = await adminCosts();
    setDishes(
      r.dishes.map((d) => ({
        id: d.id,
        c: d.c,
        sub: d.sub,
        name: d.name,
        mode: d.mode,
        price: d.price,
        yld: d.yld,
        note: d.note,
        from: d.from,
        parts: d.parts,
      })),
    );
    const hist = await adminShopHistory();
    setBuys(
      hist.lists.map((l) => {
        const when = new Date(l.closedAt ?? l.openedAt);
        return { id: l.id, title: `${l.area} · ${when.getDate()}.${when.getMonth() + 1} · ${l.items.length} פריטים` };
      }),
    );
  }, [live]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const today = new Date();
  const due = today.getDate() === 1 && !seen;
  const spec = COST_CATS.find((c) => c.id === cat) ?? COST_CATS[0];
  const list = dishes.filter((d) => d.c === cat && (!spec.subs || d.sub === sub));

  const patch = (id: string, p: Partial<Dish>) => {
    setDishes((all) => all.map((d) => (d.id === id ? { ...d, ...p } : d)));
    if (live) {
      const d = dishes.find((x) => x.id === id);
      if (!d) return;
      const next = { ...d, ...p };
      void adminPutCost(id, { price: Number(next.price), yld: Number(next.yld), parts: next.parts }).catch(() => undefined);
    }
  };

  const importBuy = async (id: string) => {
    if (!live) {
      setImpOpen(false);
      setImpDone(COSTS_IMP_NONE);
      return;
    }
    const r = await adminImportCosts(id);
    setImpOpen(false);
    setImpDone(r.message);
    await reload();
  };

  return (
    <AdminShell
      title={COSTS_TITLE}
      sub={`עדכון חודשי · ${COST_MONTHS[today.getMonth()]} ${today.getFullYear()}`}
      actions={[{ label: COSTS_IMPORT, onPress: () => setImpOpen(true) }]}
    >
      {due ? (
        <Pressable onPress={() => setSeen(true)} style={s.due}>
          <Text style={s.dueTitle}>{COSTS_DUE_TITLE}</Text>
          <Text style={s.dueSub}>{COSTS_DUE_SUB}</Text>
        </Pressable>
      ) : null}
      {impDone ? <Text style={s.impDone}>{impDone}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
        {COST_CATS.map((c) => (
          <Chip key={c.id} label={c.n} on={cat === c.id} tint={c} onPress={() => { setCat(c.id); setOpen(-1); }} />
        ))}
      </ScrollView>
      {spec.subs ? (
        <View style={s.subs}>
          {spec.subs.map((b) => (
            <Chip key={b.id} label={b.n} on={sub === b.id} tint={spec} style={s.sub} onPress={() => { setSub(b.id); setOpen(-1); }} />
          ))}
        </View>
      ) : null}

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {list.map((d, i) => {
          const isWeight = d.mode === 'weight';
          const isAuto = d.mode === 'auto';
          const unit = unitCost(d, dishes);
          const price = num(d.price);
          const costCmp = isWeight ? unit * 10 : unit;
          const profit = price - costCmp;
          const pct = price > 0 ? Math.round((profit / price) * 100) : 0;
          const thin = pct < 40;
          const isOpen = open === i;
          return (
            <View key={d.id} style={[s.card, { borderRightColor: spec.hue }]}>
              <Pressable onPress={() => setOpen(isOpen ? -1 : i)}>
                <View style={s.cardHead}>
                  <Text style={s.name}>{d.name}</Text>
                  {isAuto ? <Text style={s.auto}>{COSTS_AUTO_TAG}</Text> : null}
                </View>
                <Text style={s.sumLine}>
                  {(isWeight ? 'עלות לק״ג ' : 'עלות ליחידה ') + money(costCmp) + ' ₪ · רווחיות ' + pct + '%'}
                </Text>
              </Pressable>
              {isOpen ? (
                <View style={s.bodyCard}>
                  {d.note ? <Text style={s.note}>{d.note}</Text> : null}
                  {d.from.length > 0 ? (
                    <View>
                      <Text style={s.sec}>{COSTS_FROM_LABEL}</Text>
                      {d.from.map((f) => {
                        const src = f.id === 'salads:avg' ? 'ממוצע הסלטים' : dishes.find((x) => x.id === f.id)?.name;
                        return <Text key={f.id} style={s.from}>{`${src} × ${f.m}`}</Text>;
                      })}
                    </View>
                  ) : null}
                  <Text style={s.sec}>{isAuto ? COSTS_PACK_TITLE : COSTS_PARTS_TITLE}</Text>
                  <View style={s.cols}>
                    <Text style={[s.col, { flex: 1 }]}>{COSTS_COLS.name}</Text>
                    <Text style={[s.col, s.w40]}>{COSTS_COLS.price}</Text>
                    <Text style={[s.col, s.w52]}>{COSTS_COLS.qty}</Text>
                    <Text style={[s.col, s.w48]}>{COSTS_COLS.sum}</Text>
                  </View>
                  {d.parts.map((p, pi) => (
                    <View key={`${p.n}-${pi}`} style={s.part}>
                      <TextInput
                        value={p.n}
                        placeholder={COSTS_PART_PH}
                        placeholderTextColor="#B3ABBD"
                        onChangeText={(v) => {
                          const hit = COST_PANTRY.find((x) => x.name === v);
                          const parts = d.parts.map((x, k) =>
                            k === pi ? { ...x, n: v, price: hit ? hit.price : x.price } : x,
                          );
                          patch(d.id, { parts });
                        }}
                        style={[s.inp, { flex: 1 }]}
                      />
                      <TextInput
                        value={String(p.price)}
                        keyboardType="numeric"
                        onChangeText={(v) => {
                          const parts = d.parts.map((x, k) => (k === pi ? { ...x, price: num(v) } : x));
                          patch(d.id, { parts });
                        }}
                        style={[s.inp, s.w40]}
                      />
                      <TextInput
                        value={String(p.qty)}
                        keyboardType="numeric"
                        onChangeText={(v) => {
                          const parts = d.parts.map((x, k) => (k === pi ? { ...x, qty: num(v) } : x));
                          patch(d.id, { parts });
                        }}
                        style={[s.inp, s.w52]}
                      />
                      <Text style={[s.partSum, s.w48]}>{nf(num(p.price) * num(p.qty))}</Text>
                    </View>
                  ))}
                  {!isAuto ? (
                    <View style={s.field}>
                      <Text style={s.lab}>{isWeight ? COSTS_YIELD_WEIGHT : COSTS_YIELD_UNIT}</Text>
                      <TextInput
                        value={String(d.yld)}
                        keyboardType="numeric"
                        onChangeText={(v) => patch(d.id, { yld: num(v) })}
                        style={s.inp}
                      />
                    </View>
                  ) : null}
                  <View style={s.field}>
                    <Text style={s.lab}>{isWeight ? COSTS_PRICE_KG : COSTS_PRICE_UNIT}</Text>
                    <TextInput
                      value={String(d.price)}
                      keyboardType="numeric"
                      onChangeText={(v) => patch(d.id, { price: num(v) })}
                      style={s.inp}
                    />
                  </View>
                  <Text style={s.kpi}>{`עלות ליחידה ${money(unit)} ₪`}</Text>
                  <Text style={[s.kpi, { color: thin ? '#A65E2A' : '#4E8A64' }]}>{`רווח ${money(profit)} ₪ · ${pct}%`}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
        <Text style={s.foot}>{COSTS_FOOT}</Text>
      </ScrollView>

      {impOpen ? (
        <Sheet title={COSTS_IMP_TITLE} sub={COSTS_IMP_SUB} onClose={() => setImpOpen(false)}>
          <ScrollView style={{ maxHeight: 320 }}>
            {buys.length === 0 ? (
              <Text style={s.empty}>{COSTS_IMP_NONE}</Text>
            ) : (
              buys.map((b) => (
                <Pressable key={b.id} onPress={() => void importBuy(b.id)} style={s.buy}>
                  <Text style={s.buyT}>{b.title}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Sheet>
      ) : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  due: { borderRadius: 16, padding: 12, backgroundColor: 'rgba(199,125,62,0.12)' },
  dueTitle: { fontSize: 14, fontWeight: '600', color: '#A65E2A' },
  dueSub: { fontSize: 12, color: '#A65E2A' },
  impDone: { fontSize: 12.5, color: '#4E8A64', fontWeight: '500' },
  cats: { gap: 6 },
  subs: { flexDirection: 'row', gap: 6 },
  sub: { flex: 1 },
  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },
  card: { borderRadius: 18, padding: 13, backgroundColor: 'rgba(255,255,255,0.7)', borderRightWidth: 3, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 14.5, fontWeight: '600', color: surface.ink },
  auto: { fontSize: 10, fontWeight: '700', color: '#7B5CBC' },
  sumLine: { fontSize: 11.5, color: surface.faint },
  bodyCard: { gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(130,112,162,0.14)', paddingTop: 10 },
  note: { fontSize: 12, color: '#6E6478' },
  sec: { fontSize: 11.5, fontWeight: '600', color: surface.faint },
  from: { fontSize: 12.5, color: surface.ink },
  cols: { flexDirection: 'row', gap: 6 },
  col: { fontSize: 10, color: '#C4BDCE' },
  part: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  inp: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 8,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.18)',
    textAlign: 'right',
    color: surface.ink,
  },
  w40: { width: 40, textAlign: 'center' },
  w52: { width: 52, textAlign: 'center' },
  w48: { width: 48, textAlign: 'left' },
  partSum: { fontSize: 12, color: surface.ink },
  field: { gap: 4 },
  lab: { fontSize: 11, color: surface.faint },
  kpi: { fontSize: 13, fontWeight: '600', color: '#A65E2A' },
  foot: { fontSize: 11.5, color: surface.faint, paddingVertical: 8 },
  empty: { fontSize: 13, color: '#A79FB2', textAlign: 'center', padding: 20 },
  buy: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(130,112,162,0.12)' },
  buyT: { fontSize: 14, color: surface.ink },
});

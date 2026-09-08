import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { surface } from '../../theme/tokens';
import {
  AUTO_TAG,
  COLS,
  FROM_LABEL,
  PARTS_TITLE,
  PART_PLACEHOLDER,
  PRICE_LABEL,
  ROW_KEYS,
  SALADS_AVG,
  SALADS_AVG_LABEL,
  THIN_MARGIN,
  YIELD_LABEL,
} from '../../data/adminCosts';
import {
  comparableCost,
  money,
  nf,
  num,
  partsSum,
  saladAvg100,
  unitCost,
  type EditableDish,
} from './costEngine';
import type { useAdminCosts } from './useAdminCosts';

const AMBER = '#A65E2A';
const GREEN = '#4E8A64';

/* רוחבי העמודות בטבלת המצרכים */
const W_PRICE = 54;
const W_QTY = 54;
const W_SUM = 46;

type Props = { dish: EditableDish; hue: string; admin: ReturnType<typeof useAdminCosts> };

/** שורות החישוב שמתחת לטבלה · תלויות במצב החישוב */
function resultRows(d: EditableDish, unit: number, cmp: number, profit: number, pct: number) {
  const isWeight = d.mode === 'weight';
  const thin = pct < THIN_MARGIN;
  const rows: { k: string; v: string; size: number; weight: '400' | '600' | '700'; fg: string }[] = [];

  if (d.parts.length)
    rows.push({ k: ROW_KEYS.partsSum, v: `${nf(partsSum(d))} ₪`, size: 12.5, weight: '400', fg: surface.inkSoft });
  rows.push({
    k: isWeight ? ROW_KEYS.cost.weight : ROW_KEYS.cost.unit,
    v: `${money(unit)} ₪`, size: 15, weight: '700', fg: AMBER,
  });
  if (isWeight)
    rows.push({ k: ROW_KEYS.costKg, v: `${money(cmp)} ₪`, size: 13, weight: '600', fg: AMBER });
  rows.push({
    k: isWeight ? ROW_KEYS.profit.weight : ROW_KEYS.profit.unit,
    v: `${money(profit)} ₪`, size: 15, weight: '700', fg: thin ? AMBER : GREEN,
  });
  rows.push({ k: ROW_KEYS.margin, v: `${pct}%`, size: 13, weight: '600', fg: thin ? AMBER : GREEN });
  return rows;
}

export function DishCard({ dish: d, hue, admin }: Props) {
  const isWeight = d.mode === 'weight';
  const isAuto = d.mode === 'auto';
  const unit = unitCost(d, admin.dishes);
  const cmp = comparableCost(d, unit);
  const price = num(d.price);
  const profit = price - cmp;
  const pct = price > 0 ? Math.round((profit / price) * 100) : 0;
  const isOpen = admin.open === d.id;

  return (
    <View style={[s.card, { borderRightColor: hue }]}>
      <Pressable onPress={() => admin.toggle(d.id)} style={s.head}>
        <View style={s.headText}>
          <View style={s.nameRow}>
            <Text style={s.name}>{d.name}</Text>
            {isAuto ? (
              <View style={s.autoTag}>
                <Text style={s.autoTagText}>{AUTO_TAG}</Text>
              </View>
            ) : null}
          </View>
          <Text style={s.summary}>
            {`${isWeight ? 'עלות לק״ג ' : 'עלות ליחידה '}${money(cmp)} ₪ · רווחיות ${pct}%`}
          </Text>
        </View>
        <Text style={s.chev}>{isOpen ? '⌃' : '⌄'}</Text>
      </Pressable>

      {isOpen ? (
        <View style={s.body}>
          <View style={s.rule} />

          {d.note ? (
            <View style={s.noteBox}>
              <Text style={s.noteText}>{d.note}</Text>
            </View>
          ) : null}

          {d.from.length > 0 ? (
            <View style={s.block}>
              <Text style={s.blockTitle}>{FROM_LABEL}</Text>
              {d.from.map((f) => {
                const name =
                  f.id === SALADS_AVG
                    ? SALADS_AVG_LABEL
                    : admin.dishes.find((x) => x.id === f.id)?.name ?? f.id;
                const c1 =
                  f.id === SALADS_AVG
                    ? saladAvg100(admin.dishes)
                    : unitCost(admin.dishes.find((x) => x.id === f.id), admin.dishes, 1);
                return (
                  <View key={f.id} style={s.fromRow}>
                    <Text style={s.fromName}>{name}</Text>
                    <Text style={s.fromMult}>{`× ${f.m}`}</Text>
                    <Text style={s.fromSum}>{`${money(c1 * f.m)} ₪`}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={s.block}>
            <Text style={s.blockTitle}>{isAuto ? PARTS_TITLE.auto : PARTS_TITLE.manual}</Text>

            <View style={s.cols}>
              <Text style={[s.col, s.colName]}>{COLS.name}</Text>
              <Text style={[s.col, s.colPrice]}>{COLS.price}</Text>
              <Text style={[s.col, s.colQty]}>{COLS.qty}</Text>
              <Text style={[s.col, s.colSum]}>{COLS.sum}</Text>
              <View style={s.dropSlot} />
            </View>

            {d.parts.map((p) => {
              const hits = admin.hitsFor(p.name);
              return (
                <View key={p.id}>
                  <View style={s.partRow}>
                    <TextInput
                      value={p.name}
                      onChangeText={(v) => admin.patchPart(d.id, p.id, { name: v })}
                      placeholder={PART_PLACEHOLDER}
                      placeholderTextColor="#B3ABBD"
                      style={[s.input, s.colName]}
                    />
                    <TextInput
                      value={p.price}
                      onChangeText={(v) => admin.patchPart(d.id, p.id, { price: v })}
                      placeholder="0"
                      placeholderTextColor="#B3ABBD"
                      keyboardType="numeric"
                      style={[s.input, s.colPrice, s.numInput]}
                    />
                    <TextInput
                      value={p.qty}
                      onChangeText={(v) => admin.patchPart(d.id, p.id, { qty: v })}
                      placeholder="0"
                      placeholderTextColor="#B3ABBD"
                      keyboardType="numeric"
                      style={[s.input, s.colQty, s.numInput]}
                    />
                    <Text style={[s.partSum, s.colSum]}>{nf(num(p.price) * num(p.qty))}</Text>
                    <Pressable
                      onPress={() => admin.removePart(d.id, p.id)}
                      style={s.dropSlot}
                      hitSlop={6}
                    >
                      <Text style={s.dropGlyph}>✕</Text>
                    </Pressable>
                  </View>

                  {hits.length > 0 ? (
                    <View style={s.pantry}>
                      {hits.map((x) => (
                        <Pressable
                          key={x.name}
                          onPress={() => admin.pickPantry(d.id, p.id, x)}
                          style={s.hit}
                        >
                          <Text style={s.hitName}>{x.name}</Text>
                          <Text style={s.hitSub}>{`${x.price} ₪ ל${x.unit}`}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}

            <Pressable onPress={() => admin.addPart(d.id)} style={s.addPart}>
              <Text style={s.addPartText}>+</Text>
            </Pressable>
          </View>

          <View style={s.fields}>
            {!isAuto ? (
              <View style={s.field}>
                <Text style={s.fieldLabel}>{isWeight ? YIELD_LABEL.weight : YIELD_LABEL.unit}</Text>
                <TextInput
                  value={d.yld}
                  onChangeText={(v) => admin.patch(d.id, { yld: v })}
                  placeholder="0"
                  placeholderTextColor="#B3ABBD"
                  keyboardType="numeric"
                  style={s.fieldInput}
                />
              </View>
            ) : null}
            <View style={s.field}>
              <Text style={s.fieldLabel}>{isWeight ? PRICE_LABEL.weight : PRICE_LABEL.unit}</Text>
              <TextInput
                value={d.price}
                onChangeText={(v) => admin.patch(d.id, { price: v })}
                placeholder="0"
                placeholderTextColor="#B3ABBD"
                keyboardType="numeric"
                style={s.fieldInput}
              />
            </View>
          </View>

          <View style={s.results}>
            {resultRows(d, unit, cmp, profit, pct).map((r) => (
              <View key={r.k} style={s.resultRow}>
                <Text style={s.resultKey}>{r.k}</Text>
                <Text style={{ fontSize: r.size, fontWeight: r.weight, color: r.fg }}>{r.v}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 11,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRightWidth: 3,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 14.5, fontWeight: '600', color: surface.ink },
  autoTag: {
    borderRadius: 7,
    paddingVertical: 1,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(123,92,188,0.12)',
  },
  autoTagText: { fontSize: 10, fontWeight: '700', color: '#43307A' },
  summary: { fontSize: 11.5, fontWeight: '300', color: surface.faint, marginTop: 2 },
  chev: { fontSize: 14, color: '#A79FB2' },

  body: { gap: 11 },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.14)' },
  noteBox: { borderRadius: 12, padding: 10, backgroundColor: 'rgba(130,112,162,0.06)' },
  noteText: { fontSize: 11.5, fontWeight: '300', lineHeight: 17, color: surface.muted },

  block: { gap: 6 },
  blockTitle: { fontSize: 11.5, fontWeight: '600', color: surface.faint },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fromName: { flex: 1, fontSize: 12.5, color: surface.inkSoft },
  fromMult: { fontSize: 11.5, color: '#A79FB2' },
  fromSum: { fontSize: 12.5, fontWeight: '600', color: AMBER },

  cols: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  col: { fontSize: 10, fontWeight: '500', color: '#C4BDCE' },
  colName: { flex: 1 },
  colPrice: { width: W_PRICE },
  colQty: { width: W_QTY },
  colSum: { width: W_SUM },
  partRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 8,
    fontSize: 12,
    color: surface.ink,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.18)',
    textAlign: 'right',
  },
  numInput: { textAlign: 'center' },
  partSum: { fontSize: 12, fontWeight: '600', color: surface.inkSoft, textAlign: 'center' },
  dropSlot: { width: 18, alignItems: 'center' },
  dropGlyph: { fontSize: 11, color: '#C4BDCE' },
  addPart: {
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(130,112,162,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPartText: { fontSize: 16, fontWeight: '700', color: '#6E6478', lineHeight: 19 },

  pantry: {
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
  },
  hit: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130,112,162,0.1)',
  },
  hitName: { fontSize: 12.5, fontWeight: '500', color: surface.ink },
  hitSub: { fontSize: 10.5, fontWeight: '300', color: '#A79FB2' },

  fields: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 10.5, fontWeight: '500', color: surface.faint },
  fieldInput: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 10,
    fontSize: 13,
    color: surface.ink,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
    textAlign: 'center',
  },

  results: { gap: 5, borderRadius: 14, padding: 11, backgroundColor: 'rgba(130,112,162,0.05)' },
  resultRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  resultKey: { fontSize: 11.5, fontWeight: '300', color: surface.muted },
});

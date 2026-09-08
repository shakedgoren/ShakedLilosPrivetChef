import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  BUYS,
  CATS,
  COSTS_TITLE,
  DUE_SUB,
  DUE_TITLE,
  IMPORT,
  MONTHS,
  SCREEN_NOTE,
  SUB_PREFIX,
  TODAY,
} from '../data/adminCosts';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { ChipRail } from './ui/ChipRail';
import { Sheet } from './ui/Sheet';
import { DishCard } from './costs/DishCard';
import { useAdminCosts } from './costs/useAdminCosts';

const AMBER = '#A65E2A';

export function AdminCostsScreen() {
  const admin = useAdminCosts();

  const cat = CATS.find((c) => c.id === admin.cat) ?? CATS[0];
  const list = admin.dishes.filter(
    (d) => d.c === admin.cat && (!cat.subs || d.sub === admin.sub),
  );
  /* התזכורת נדלקת מעצמה ב-1 בחודש · עד שסוגרים אותה */
  const due = TODAY.d === 1 && !admin.seen;

  return (
    <AdminShell
      title={COSTS_TITLE}
      sub={`${SUB_PREFIX}${MONTHS[TODAY.m]} ${TODAY.y}`}
      actions={[{ label: IMPORT.label, onPress: admin.openImp }]}
    >
      {admin.impDone ? (
        <View style={s.impDone}>
          <Text style={s.impDoneText}>{admin.impDone}</Text>
        </View>
      ) : null}

      {due ? (
        <View style={s.due}>
          <View style={s.dueText}>
            <Text style={s.dueTitle}>{DUE_TITLE}</Text>
            <Text style={s.dueSub}>{DUE_SUB}</Text>
          </View>
          <Pressable onPress={admin.dismissDue} hitSlop={8}>
            <Text style={s.dueClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      <ChipRail>
        {CATS.map((c) => (
          <Chip
            key={c.id}
            label={c.n}
            on={admin.cat === c.id}
            tint={c}
            onPress={() => admin.pickCat(c.id)}
          />
        ))}
      </ChipRail>

      {cat.subs ? (
        <ChipRail>
          {cat.subs.map((b) => (
            <Chip
              key={b.id}
              label={b.n}
              on={admin.sub === b.id}
              tint={cat}
              onPress={() => admin.pickSub(b.id)}
            />
          ))}
        </ChipRail>
      ) : null}

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {list.map((d) => (
          <DishCard key={d.id} dish={d} hue={cat.hue} admin={admin} />
        ))}
        <Text style={s.note}>{SCREEN_NOTE}</Text>
      </ScrollView>

      {admin.impOpen ? (
        <Sheet title={IMPORT.title} sub={IMPORT.sub} onClose={admin.closeImp} style={s.impSheet}>
          <View style={s.buys}>
            {BUYS.map((b) => (
              <Pressable key={`${b.area}-${b.d}`} onPress={() => admin.importBuy(b)} style={s.buy}>
                <View style={s.buyText}>
                  <Text style={s.buyTitle}>{`${b.area} · ${b.d} · ${b.t}`}</Text>
                  <Text style={s.buyCount}>{`${b.rows.length} פריטים`}</Text>
                </View>
                <Text style={s.buyChev}>‹</Text>
              </Pressable>
            ))}
          </View>
        </Sheet>
      ) : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  impDone: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(78,138,100,0.12)',
  },
  impDoneText: { fontSize: 12.5, fontWeight: '600', color: '#4E8A64' },

  due: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(199,125,62,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(199,125,62,0.26)',
  },
  dueText: { flex: 1 },
  dueTitle: { fontSize: 13, fontWeight: '600', color: AMBER },
  dueSub: { fontSize: 11.5, fontWeight: '300', color: surface.muted, marginTop: 1 },
  dueClose: { fontSize: 13, color: '#6E6478' },

  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },
  note: {
    fontSize: 11,
    fontWeight: '300',
    lineHeight: 16,
    color: surface.muted,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },

  impSheet: { top: 150 },
  buys: { gap: 8, marginTop: 12 },
  buy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(130,112,162,0.06)',
  },
  buyText: { flex: 1 },
  buyTitle: { fontSize: 13, fontWeight: '600', color: surface.ink },
  buyCount: { fontSize: 11, fontWeight: '300', color: '#A79FB2', marginTop: 1 },
  buyChev: { fontSize: 16, color: '#A79FB2' },
});

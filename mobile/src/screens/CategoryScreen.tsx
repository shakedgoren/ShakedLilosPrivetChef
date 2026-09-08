import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '../data/categories';
import { a, radius, space, surface, type } from '../theme/tokens';
import { useNav } from '../navigation/store';
import type { CategoryKey } from '../theme/tokens';

/**
 * שלד מסך הקטגוריה · הכותרת, החזרה וחסם ההתחברות עובדים.
 * תוכן ההזמנה עצמו (הכמויות, השלבים, הסיכום) עדיין לא הועבר מהקנבס.
 *
 * חסם ההתחברות חל על קוסקוס, שישניצל, ספיישל ופירות.
 * שף וטאבון פתוח עד הסוף גם בלי חשבון — החלטה של שקד.
 */
const OPEN_WITHOUT_ACCOUNT: CategoryKey[] = ['chef'];

export function CategoryScreen({ categoryKey }: { categoryKey: CategoryKey }) {
  const { back, go, loggedIn } = useNav();
  const [gate, setGate] = useState(false);
  const cat = CATEGORIES.find((c) => c.key === categoryKey)!;
  const needsAccount = !OPEN_WITHOUT_ACCOUNT.includes(categoryKey);

  const onContinue = () => {
    if (needsAccount && !loggedIn) setGate(true);
    else {
      /* כאן ייכנס זרימת ההזמנה · טרם הועברה מהקנבס */
    }
  };

  return (
    <View style={s.page}>
      <Pressable onPress={back} style={s.back}>
        <Text style={s.backGlyph}>›</Text>
      </Pressable>

      <View style={s.head}>
        <Text style={s.title}>{cat.sub}</Text>
        <Text style={s.desc}>{cat.desc}</Text>
      </View>

      <View style={[s.stub, { borderColor: a(cat.rgb, 0.34) }]}>
        <Text style={[s.stubText, { color: a(cat.rgb, 0.72) }]}>
          תוכן ההזמנה של {cat.title} עדיין לא הועבר מהעיצוב
        </Text>
      </View>

      <Pressable onPress={onContinue} style={[s.cta, { backgroundColor: a(cat.rgb, 0.5) }]}>
        <Text style={[s.ctaText, { color: cat.deep }]}>המשך</Text>
      </Pressable>

      <Modal visible={gate} transparent animationType="fade" onRequestClose={() => setGate(false)}>
        <Pressable style={s.scrim} onPress={() => setGate(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>צריך להתחבר כדי להמשיך</Text>
            <Text style={s.sheetBody}>
              הבחירות שלך נשמרות · אחרי ההתחברות חוזרים בדיוק לכאן.
            </Text>
            <View style={s.sheetRow}>
              <Pressable onPress={() => setGate(false)} style={[s.sheetBtn, s.sheetGhost]}>
                <Text style={s.sheetGhostText}>ביטול</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setGate(false);
                  go('login');
                }}
                style={[s.sheetBtn, s.sheetGo]}
              >
                <Text style={s.sheetGoText}>להתחברות</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground, padding: space.lg, paddingTop: 90 },
  back: {
    position: 'absolute',
    top: 30,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F4F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: { fontSize: 24, color: '#6E6478', lineHeight: 26 },
  head: { gap: 6 },
  title: { fontSize: 20, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  desc: { fontSize: type.label, color: surface.muted, textAlign: 'center' },
  stub: {
    marginTop: space.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.field,
    padding: space.xl,
    alignItems: 'center',
  },
  stubText: { fontSize: type.label, textAlign: 'center' },
  cta: {
    marginTop: 'auto',
    marginBottom: 40,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '600' },

  scrim: { flex: 1, backgroundColor: 'rgba(42,36,48,0.34)', justifyContent: 'center', padding: 30 },
  sheet: { borderRadius: radius.card, padding: 22, backgroundColor: '#FEFCFB', alignItems: 'center', gap: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  sheetBody: { fontSize: 13, color: surface.muted, textAlign: 'center', lineHeight: 20 },
  sheetRow: { flexDirection: 'row', gap: 9, marginTop: space.md, alignSelf: 'stretch' },
  sheetBtn: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  sheetGhost: { backgroundColor: 'rgba(130,112,162,0.09)' },
  sheetGhostText: { fontSize: 14, fontWeight: '600', color: surface.inkSoft },
  sheetGo: { backgroundColor: '#BCA7E6' },
  sheetGoText: { fontSize: 14, fontWeight: '600', color: '#43307A' },
});

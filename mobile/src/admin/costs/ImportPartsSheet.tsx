import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../ui/text';
import { surface } from '../../theme/tokens';
import { Sheet } from '../ui/Sheet';
import { adminCostPantry, type PantryPick } from '../../api/admin';

/**
 * ייבוא מצרכים מהקניות אל מנה **אחת**.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״נגיד שאני עומדת על מפרום,
 * שאני אוכל ללחוץ על ייבוא ואז לסמן דברים מהקניות ששימשו אותי
 * להכנת המנה, ואז הם ייכנסו לעלויות של המוצר — ולא באופן אוטומטי״.
 *
 * ⚠ **מה ההבדל מכפתור הייבוא שבראש המסך** · זה שלמעלה לוקח רשימת
 * קניות שלמה ומרענן מחיר לכל מצרך ששמו תואם, **בכל המנות**. הוא
 * לא יכול להוסיף מצרך, ולא יכול לגעת במנה אחת בלבד. כאן היא
 * בוחרת שורות, והן נכנסות למנה שפתוחה מולה.
 *
 * ⚠ **מחיר ליחידה** · מגיע כבר מחושב מהשרת. ראו את ההסבר
 * ב-`server/src/admin/pantryFromShop.ts` — סכום השורה אינו מחיר
 * היחידה, וטעות שם מנפחת עלות מנה בשקט.
 *
 * ⚠ **לא נשמר כאן** · הבחירה חוזרת לקורא, והוא מוסיף אותה
 * לרשימת המצרכים של המנה דרך אותו `patch` של כל שאר העריכות.
 */

/** ⚠ כל הנוסחים בקובץ הזה נכתבו על ידי Claude · שקד לא כתבה אותם */
const TITLE = 'ייבוא מצרכים מהקניות';
const SUB = 'סימון מה שנכנס למנה הזו · המחיר הוא מה ששולם בפועל';
const EMPTY = 'עוד לא נסגרה קנייה עם מצרכים שנקנו';
const OFFLINE = 'הרשימה נטענת מהשרת · אין חיבור כרגע';
const FAILED = 'לא הצלחנו לטעון את המצרכים · אפשר לנסות שוב';
const SEARCH = 'חיפוש מצרך';
const ADD = 'הוספה';
const LOADING = 'טוענת…';

export type ImportPart = { n: string; price: number; qty: number };

type Props = {
  /** שם המנה · כדי שיהיה ברור לאן זה נכנס */
  dish: string;
  live: boolean;
  onClose: () => void;
  onAdd: (parts: ImportPart[]) => void;
};

/** ‎3.33 → ‎3.33 · ‎40 → ‎40 */
const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

export function ImportPartsSheet({ dish, live, onClose, onAdd }: Props) {
  const [items, setItems] = React.useState<PantryPick[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [picked, setPicked] = React.useState<Record<string, boolean>>({});
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (!live) {
      setItems([]);
      return;
    }
    let alive = true;
    void adminCostPantry()
      .then((r) => {
        if (alive) setItems(r.items);
      })
      .catch(() => {
        if (alive) {
          setItems([]);
          setFailed(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [live]);

  const shown = React.useMemo(() => {
    const needle = q.trim();
    if (!needle) return items ?? [];
    return (items ?? []).filter((x) => x.name.includes(needle) || x.g.includes(needle));
  }, [items, q]);

  const chosen = (items ?? []).filter((x) => picked[x.name]);

  const confirm = () => {
    if (!chosen.length) return;
    /* ⚠ כמות 1 · הכמות במתכון היא החלטה שלה, לא של הקנייה */
    onAdd(chosen.map((x) => ({ n: x.name, price: x.price, qty: 1 })));
    onClose();
  };

  const note = !live ? OFFLINE : failed ? FAILED : items === null ? LOADING : EMPTY;

  return (
    <Sheet title={TITLE} sub={`${SUB} · ${dish}`} onClose={onClose}>
      <View style={s.wrap}>
        {items && items.length > 0 ? (
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={SEARCH}
            placeholderTextColor="#B3ABBD"
            style={s.search}
          />
        ) : null}

        <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
          {shown.length === 0 ? (
            <Text style={s.empty}>{note}</Text>
          ) : (
            shown.map((x) => {
              const on = !!picked[x.name];
              return (
                <Pressable
                  key={x.name}
                  onPress={() => setPicked((p) => ({ ...p, [x.name]: !p[x.name] }))}
                  style={[s.row, on && s.rowOn]}
                >
                  <View style={[s.box, on && s.boxOn]}>
                    {on ? <Text style={s.tick}>✓</Text> : null}
                  </View>
                  <View style={s.text}>
                    <Text style={s.name} numberOfLines={1}>{x.name}</Text>
                    {x.g ? <Text style={s.sub} numberOfLines={1}>{x.g}</Text> : null}
                  </View>
                  <Text style={s.price}>
                    {`${money(x.price)} ₪${x.unit ? ` · ${x.unit}` : ''}`}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <View style={s.footer}>
          <Pressable
            onPress={confirm}
            disabled={chosen.length === 0}
            style={[s.add, chosen.length === 0 && s.addOff]}
          >
            <Text style={s.addText}>
              {chosen.length ? `${ADD} · ${chosen.length}` : ADD}
            </Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  search: {
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.18)',
    fontSize: 14,
    color: surface.ink,
  },
  list: { maxHeight: 300 },
  empty: { fontSize: 14, color: surface.faint, textAlign: 'center', paddingVertical: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowOn: { backgroundColor: 'rgba(123,92,188,0.1)' },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: '#7B5CBC', borderColor: '#7B5CBC' },
  tick: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', lineHeight: 15 },
  text: { flex: 1, gap: 1 },
  name: { fontSize: 14.5, fontWeight: '500', color: surface.ink },
  sub: { fontSize: 12, fontWeight: '300', color: surface.faint },
  price: { fontSize: 13.5, fontWeight: '600', color: '#43307A' },
  footer: { alignItems: 'center' },
  add: {
    height: 40,
    paddingHorizontal: 26,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6B3EC',
  },
  addOff: { opacity: 0.45 },
  addText: { fontSize: 15, fontWeight: '700', color: '#2E2148' },
});

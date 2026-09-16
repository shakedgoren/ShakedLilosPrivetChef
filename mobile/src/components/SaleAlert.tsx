import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Close } from '../icons';
import { S } from './Sym';
import { BellSwing } from './BellSwing';
import { a, hues, radius, space, surface, type CategoryKey } from '../theme/tokens';
import { categoryName, categoryKey } from '../screens/orders/format';

/**
 * שורת ההתראה ״המכירה נפתחה״.
 *
 * ⚠ **אינה מהקנבס** · שקד ביקשה ב-15 בספטמבר 2026 שהתזכורת שנרשמה
 * בחלונית הפעמון תגיע **כהתראה בתוך האפליקציה**. היא יושבת בראש
 * דף הבית, ונעלמת אחרי שנוגעים בה.
 */

const BELL = 18;
const CLOSE = 12;

type Props = {
  /** מפתח הקטגוריה שנפתחה · 'cous' / 'schn' וכו׳ */
  category: string;
  onOpen: () => void;
  onDismiss: () => void;
};

export function SaleAlert({ category, onOpen, onDismiss }: Props) {
  const key = categoryKey(category) as CategoryKey;
  const accent = hues[key];
  const name = categoryName(category);

  return (
    <Pressable
      onPress={onOpen}
      style={[
        s.bar,
        { backgroundColor: a(accent.rgb, 0.1), borderColor: a(accent.rgb, 0.28) },
      ]}
    >
      {/* ⚠ הפעמון מתנדנד · בחירה של שקד (15 בספטמבר 2026).
          פעמיים כשההתראה מופיעה, ואז נח. */}
      <View style={[s.ring, { backgroundColor: a(accent.rgb, 0.16) }]}>
        {/* ⚠ SF Symbols · bell.and.waves עם התנודה החוזרת שביקשה שקד.
            ה-BellSwing הישן ירד — התנועה מגיעה עכשיו מהסמל עצמו. */}
        <S k="bell" size={BELL} color={accent.deep} />
      </View>

      <View style={s.text}>
        <Text style={[s.title, { color: accent.deep }]}>{name} נפתח להזמנות</Text>
        <Text style={s.sub}>ביקשת שנזכיר · אפשר להזמין עכשיו</Text>
      </View>

      {/* ⚠ `stopPropagation` דרך `onPress` נפרד · בלי זה סגירת
          ההתראה הייתה גם פותחת את הקטגוריה */}
      <Pressable onPress={onDismiss} hitSlop={10} style={s.close}>
        <Close size={CLOSE} color={surface.faint} strokeWidth={2.6} />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: space.md,
  },
  ring: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  text: { flexGrow: 1, flexShrink: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600' },
  sub: { fontSize: 11.5, fontWeight: '300', color: surface.muted },
  close: { padding: 4 },
});

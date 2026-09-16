import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { a, surface, type } from '../theme/tokens';
import { orbShadow } from '../theme/glass';
import type { Category } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { Orb } from './Orb';
import { SWIPE_SURFACE, useCategorySwipe } from './useCategorySwipe';

/**
 * שורת הבועות מתחת לכרטיס · לחיצה מחליפה קטגוריה, וגם החלקה
 * לרוחב השורה מחליפה — אותה מחווה בדיוק כמו על הכרטיס.
 *
 * ⚠ הבועה קטנה מזו שבקנבס (46 במקום 56) לבקשת שקד: הבועות חתכו
 * את תחתית הכרטיס ואת ההילה שלו.
 * ⚠ נקודת האור כבויה כאן (`spark={false}`) לבקשת שקד · בקנבס היא קיימת.
 */
type Props = {
  items: Category[];
  active: number;
  onActiveChange: (next: number) => void;
};

/**
 * מידות הבועה, האייקון והעמודה · **נמדדו מתמונת הייחוס** ששקד שלחה
 * ב-16 בספטמבר 2026, אחרי שביקשה ״תגדיל את האייקונים וגם את הבועות
 * ותקרב בינהם״.
 *
 * בתמונה שלה הבועה תופסת כ-77% מהמרווח שבין שני מרכזים, והאיור
 * כ-66% מקוטר הבועה.
 *
 * ⚠ **סבב שני של הגדלה** · שקד ביקשה ״תגדיל עוד קצת את העיגול עצמו
 * וגם את האייקון שבתוכו שזה יהיה ברור יותר, אין בעייה שיהיה פחות
 * רווח בין העיגולים רק שלא יהיו צמודים״. הבועה 62→70 והאיור 41→50,
 * כלומר האיור תופס עכשיו 71% מהבועה במקום 66% — **מעל היחס שבתמונה**,
 * כי היא ביקשה במפורש שיהיה ברור יותר.
 *
 * ⚠ **הרווח בין הבועות** · רוחב העמודה נשאר 76 כדי שהכיתוב ״חוויה
 * אישית״ לא יישבר לשתי שורות, ולכן המרווח בין מרכזים נשאר 80 והרווח
 * בין שפה לשפה יורד מ-17 ל-10. הבועה הפעילה מוגדלת ב-POP ל-75, ולכן
 * גם היא אינה נוגעת בשכנות. **זה הגבול** — בועה גדולה מ-73 תיגע
 * בשכנתה ברגע שהיא נבחרת.
 *
 * ⚠ **הבועה הייתה 46** · שקד ביקשה בעבר להקטין אותה כי הבועות חתכו
 * את תחתית הכרטיס. הבקשות החדשות הפוכות ומאוחרות יותר ולכן הן
 * גוברות — אבל זה המקום להסתכל אם הכרטיס שוב נחתך.
 * ⚠ **רוחב העמודה ירד מ-68 ל-76** · זה מה שקירב את הבועות בסבב הקודם.
 */
const ORB = 70;
const GLYPH = 50;
const COL = 76;
/**
 * המרווח שמפריד את השורה מהכרטיס.
 * ⚠ היה 26 · תוספת מעל הקנבס שנועדה לפנות מקום להילות. שקד ביקשה
 * לצמצם חזרה למרווח של הקנבס, ולכן ההזזה ירדה ל-0 והמרווח הנמדד
 * ירד מ-72 ל-46 פיקסלים.
 */
const RAIL_DROP = 0;
/** ההתרוממות של הבועה הפעילה · מהקנבס */
const LIFT = -5;
const POP = 1.07;

export function CategoryRail({ items, active, onActiveChange }: Props) {
  const pan = useCategorySwipe({ active, count: items.length, onChange: onActiveChange });

  return (
    <View {...pan.panHandlers} style={[s.row, SWIPE_SURFACE]}>
      {items.map((it, i) => {
        const on = i === active;
        return (
          <Pressable key={it.key} onPress={() => onActiveChange(i)} style={s.col}>
            <View style={[s.lift, { transform: [{ translateY: on ? LIFT : 0 }, { scale: on ? POP : 1 }] }]}>
              {/* ⚠ **הבועה הפעילה הוחוורה** · tint/halo היו 0.3/0.42 והיא
                  נראתה סגול מלא לצד ארבע בועות חיוורות. בתמונת הייחוס ששקד
                  שלחה כל חמש הבועות באותה עוצמה בדיוק, ולכן ההפרש כאן ירד
                  ל-0.18 מול 0.15 — כמעט זהה. סימון הקטגוריה הפעילה נשען
                  מעכשיו על ההתרוממות, הכיתוב המודגש והקו מתחת. */}
              <Orb
                rgb={it.rgb}
                size={ORB}
                shadow={orbShadow(it.rgb, on)}
                tint={on ? 0.18 : 0.15}
                halo={on ? 0.26 : 0.14}
                spark={false}
              >
                {/* ⚠ האיור מגיע עם צבעיו · הקטגוריה הרדומה מעומעמת ולא נצבעת */}
                <CategoryIcon categoryKey={it.key} size={GLYPH} dim={!on} />
              </Orb>
            </View>
            <Text style={[s.name, { color: on ? surface.ink : '#A79FB2', fontWeight: on ? '600' : '400' }]}>
              {it.short}
            </Text>
            <Text style={[s.tag, { color: on ? it.hue : a(it.rgb, 0.5) }]}>{it.tag}</Text>
            <View style={[s.underline, { backgroundColor: on ? it.hue : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 2, paddingTop: RAIL_DROP },
  col: { width: COL, alignItems: 'center', gap: 8 },
  lift: { width: ORB, height: ORB },
  name: { fontSize: type.tiny, textAlign: 'center', lineHeight: type.tiny * 1.25 },
  tag: { fontSize: 10, textAlign: 'center', lineHeight: 12.5 },
  underline: { height: 2.5, width: 26, borderRadius: 999 },
});

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface, type } from '../theme/tokens';
import { useNav } from '../navigation/store';
import { BackButton } from './BackButton';

/**
 * כותרת מסך הקטגוריה · חץ החזרה, השם והתאריך.
 *
 * ⚠ הכותרת מרחפת · בקנבס גוש הכותרת יושב ב-`top: 30` בדיוק כמו
 * חץ החזרה, ואזור הגלילה מתחיל ב-`top: 88`. באפליקציה הכותרת
 * ישבה בזרימה אחרי ריפוד של 88, ולכן כל התוכן במסכים הפנימיים
 * ירד ב-58 פיקסלים מתחת למקום שלו. עכשיו היא מרחפת כמו בקנבס,
 * וכל חמשת המסכים עלו יחד.
 */
/**
 * `date` מקבל גם מערך · מסך הפירות מציג שם שתי שורות במקום תאריך
 * אחד, כדי ששורות הפעילות יישבו בדיוק במקום של ״שלישי · 25 באוגוסט״
 * במסך הקוסקוס. בקשה מפורשת של שקד.
 */
type Props = { title: string; date?: string | readonly string[] };

export function CategoryHeader({ title, date }: Props) {
  const { back } = useNav();
  const dateLines = date === undefined ? [] : typeof date === 'string' ? [date] : date;

  return (
    <>
      <BackButton onPress={back} tint="#F4F0FA" />
      <View style={s.head}>
        <Text style={s.title}>{title}</Text>
        {dateLines.map((line) => (
          <Text key={line} style={s.date}>
            {line}
          </Text>
        ))}
      </View>
    </>
  );
}

/** מיקום הכותרת וחץ החזרה · שניהם ב-top 30 בקנבס */
const HEAD_TOP = 30;
const HEAD_INSET = 74;

const s = StyleSheet.create({
  back: {
    position: 'absolute',
    top: HEAD_TOP,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F4F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  /* גוש הכותרת · אותם ערכים של הקנבס · top 30, מרווח 74 מכל צד */
  head: {
    position: 'absolute',
    top: HEAD_TOP,
    right: HEAD_INSET,
    left: HEAD_INSET,
    alignItems: 'center',
    gap: 1,
    zIndex: 1,
  },
  title: { fontSize: 20, fontWeight: '600', color: surface.ink },
  date: { fontSize: type.label, color: '#7A7080' },
});

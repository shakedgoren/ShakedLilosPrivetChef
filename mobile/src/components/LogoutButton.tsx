import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNav } from '../navigation/store';
import { LogoutConfirm } from './LogoutConfirm';
import { S } from './Sym';
import { PASS_TOUCH } from '../theme/pointerEvents';
import { LOGOUT_EDGE, LOGOUT_FILL } from '../theme/glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * כפתור ההתנתקות · מרחף בפינה השמאלית העליונה בכל רחבי האפליקציה.
 *
 * ⚠ **לא מהקנבס.** בקנבס ההתנתקות קיימת רק ב-`MyOrders` וב-`Profile`,
 * ושם היא מצוירת כתו הטקסט `⎋` — סמל ה-Escape. שקד אמרה שזה לא מובן
 * וביקשה אייקון אחר, ושהכפתור יופיע בכל המסכים.
 *
 * ⚠ האייקון **אינו** ב-`icons/index.tsx` · הקובץ ההוא נוצר אוטומטית
 * מהקנבס, ואייקון שאינו בקנבס יימחק בסריקה הבאה. אותו טעם כמו `EyeToggle`.
 *
 * מותקן פעם אחת ב-`App.tsx`, ולכן כל מסך מקבל אותו בלי לדעת עליו.
 */

/* מידות · מיושר לחץ החזרה שבצד השני של המסך */
const SIZE = 38;
const TOP = 22;
const SIDE = 18;
const GLYPH = 18;

/**
 * דלת עם חץ יוצא · החץ מצביע שמאלה, כלומר החוצה מהדלת,
 * כי זה כיוון היציאה בממשק RTL.
 */
export function LogoutButton() {
  const { loggedIn, signOut, loginOverlay, screen } = useNav();
  const [open, setOpen] = useState(false);
  /**
   * ⚠ **חייב להוסיף את האזור הבטוח ידנית** · תוקן ב-16 בספטמבר 2026.
   *
   * שקד דיווחה שכפתור ההתנתקות אינו באותו גובה של חץ החזרה ״בכל
   * רחבי האפליקציה״ אחרי התחברות. נמדד בסימולטור: הכפתור ישב
   * **בתוך שורת הסטטוס**, חופף לשעון, וחץ החזרה הרבה מתחתיו.
   *
   * הסיבה: השכבה כאן היא `position: absolute` בתוך `SafeAreaView`,
   * ו**מיקום מוחלט אינו מכבד את הריפוד של האזור הבטוח** — `top: 22`
   * נמדד מקצה המסך ולא מתחת למגרעת. חץ החזרה לעומת זאת יושב בתוך
   * הזרימה, כלומר כבר אחרי הריפוד.
   *
   * ⚠ בדפדפן זה לא נראה · שם אין מגרעת ושני הכפתורים יצאו ב-y=22.
   * נמדד בשניהם.
   */
  const insets = useSafeAreaInsets();

  /* אין למי להתנתק, ובשכבת ההתחברות הכפתור רק היה מבלבל */
  if (!loggedIn || loginOverlay) return null;

  /**
   * ⚠ **לא במסכי הניהול.** שם הפינה השמאלית העליונה תפוסה בכפתור
   * ״לחנות״, ונמדד ש-`elementFromPoint` על ״לחנות״ החזיר את כפתור
   * ההתנתקות — כלומר הוא בלע אותו ואי אפשר היה ללחוץ.
   * הבקשה של שקד הייתה במפורש לצד הלקוחה; עיצוב הניהול בא אחר כך.
   */
  if (screen.startsWith('admin')) return null;

  return (
    <View style={[s.slot, PASS_TOUCH]}>
      <Pressable onPress={() => setOpen(true)} style={[s.button, { top: insets.top + TOP }]} hitSlop={8}>
        <S k="logout" size={GLYPH} color="#FFFFFF" />
      </Pressable>

      <LogoutConfirm
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          signOut();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ `box-none` · השכבה פרושה על כל המסך כדי למקם את הכפתור,
     ובלי זה היא בולעת את כל הלחיצות במסך שמתחתיה */
  slot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3 },
  /* ⚠ `top` נקבע בזמן ריצה · הוא תלוי באזור הבטוח */
  button: {
    position: 'absolute',
    left: SIDE,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    /**
     * ⚠ **סגול מלא · 26 בספטמבר 2026** · היה לבן כמעט אטום עם
     * סמל אפור. שקד שלחה תמונה של שני הכפתורים וביקשה ״תבנה
     * אותם בדיוק אותו הדבר״: עיגול סגול מלא, סמל לבן, ושפה
     * תחתונה כהה שנותנת נפח. הגוון נדגם מהתמונה עצמה.
     *
     * ⚠ **הוא עדיין עובר מעל מסכים בכל גוני הקטגוריות** · זו
     * הייתה הסיבה ללבן. הסגול הזה כהה מכל חמשת הגוונים, ולכן
     * הוא נקרא על כולם — נמדד מול `hues` ב-`tokens`.
     */
    backgroundColor: LOGOUT_FILL,
    boxShadow: LOGOUT_EDGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

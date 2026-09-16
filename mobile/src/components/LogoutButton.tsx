import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNav } from '../navigation/store';
import { LogoutConfirm } from './LogoutConfirm';
import { S } from './Sym';
import { PASS_TOUCH } from '../theme/pointerEvents';

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
const GLYPH = 17;
const STROKE = 1.9;
const INK = '#6E6478';

/**
 * דלת עם חץ יוצא · החץ מצביע שמאלה, כלומר החוצה מהדלת,
 * כי זה כיוון היציאה בממשק RTL.
 */
export function LogoutButton() {
  const { loggedIn, signOut, loginOverlay, screen } = useNav();
  const [open, setOpen] = useState(false);

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
      <Pressable onPress={() => setOpen(true)} style={s.button} hitSlop={8}>
        <S k="logout" size={GLYPH} />
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
  button: {
    position: 'absolute',
    top: TOP,
    left: SIDE,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    /* לבן כמעט אטום · הכפתור עובר מעל מסכים בכל גוני הקטגוריות */
    backgroundColor: 'rgba(255,255,255,0.9)',
    boxShadow: '0 3px 9px -4px rgba(20,16,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

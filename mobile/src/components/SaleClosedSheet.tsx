import React from 'react';
import { S } from './Sym';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from '../icons';
import { ContinueButton } from './ContinueButton';
import { a, radius, space, surface } from '../theme/tokens';
import { iconOrbShadow } from '../theme/glass';

/**
 * ״יום המכירה עדיין לא נפתח״.
 *
 * ⚠ **אינה מהקנבס** · שקד ביקשה שלחיצה על ״להזמין שוב״ ביום סגור
 * תפתח חלונית עם אייקון פעמון, שתשאל אם לקבל תזכורת כשהמכירה
 * נפתחת.
 *
 * ⚠ **התזכורת נשמרת ולא נשלחת** · איך היא מגיעה ללקוחה (וואטסאפ,
 * SMS או התראה) עדיין לא הוחלט, וזו חסימה פתוחה בפנקס. הבקשה
 * נשמרת בשרת כדי שכלום לא יאבד ביום שההחלטה תתקבל.
 */

const BELL = 30;
const BELL_RING = 76;

type Props = {
  open: boolean;
  /** שם הקטגוריה בעברית · ״שלישי של קוסקוס״ וכדומה */
  categoryName: string;
  /** גוון הקטגוריה */
  accent: { hue: string; deep: string; rgb: string };
  /** ההודעה מהשרת · ״אין יום מכירה בתאריך הזה״ וכדומה */
  note?: string;
  /** נשמר כבר · החלונית מודה ומציעה לסגור */
  done: boolean;
  busy?: boolean;
  err?: string;
  onRemind: () => void;
  onClose: () => void;
};

export function SaleClosedSheet({
  open,
  categoryName,
  accent,
  note,
  done,
  busy = false,
  err,
  onRemind,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <Pressable onPress={onClose} style={s.close} hitSlop={8}>
            <S k="close" size={13} color="#6E6478" />
          </Pressable>

          <View style={[s.ring, { backgroundColor: a(accent.rgb, 0.12) }]}>
            <Bell size={BELL} color={accent.deep} strokeWidth={1.7} />
          </View>

          <Text style={s.title}>
            {done ? 'נרשמת לתזכורת' : 'יום המכירה עדיין לא נפתח'}
          </Text>
          <Text style={s.body}>
            {done
              ? `נעדכן אותך ברגע ש${categoryName} ייפתח להזמנות.`
              : note || `${categoryName} עדיין לא פתוח להזמנות.`}
          </Text>

          {!done ? (
            <Text style={s.ask}>רוצה שנזכיר לך כשהמכירה נפתחת?</Text>
          ) : null}

          {err ? <Text style={s.err}>{err}</Text> : null}

          <ContinueButton
            onPress={done ? onClose : onRemind}
            accent={accent}
            disabled={busy}
            label={done ? 'סגירה' : 'כן, תזכירו לי'}
            wide
          />

          {!done ? (
            <Pressable onPress={onClose} style={s.skip} hitSlop={6}>
              <Text style={s.skipText}>לא תודה</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(42,36,48,0.34)',
    justifyContent: 'center',
    padding: space.lg,
  },
  sheet: {
    borderRadius: 28,
    padding: space.lg,
    paddingTop: 26,
    backgroundColor: '#FEFCFB',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 26px 60px -22px rgba(60,48,84,0.72)',
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  boxShadow: iconOrbShadow('130,112,162'),
  },
  ring: {
    width: BELL_RING,
    height: BELL_RING,
    borderRadius: BELL_RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: { fontSize: 18, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  body: {
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19.5,
    color: surface.muted,
    textAlign: 'center',
  },
  ask: { fontSize: 13.5, fontWeight: '500', color: surface.inkSoft, textAlign: 'center', marginTop: 2 },
  err: { fontSize: 11.5, color: '#B95349', textAlign: 'center' },
  skip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill },
  skipText: { fontSize: 13, color: surface.faint },
});

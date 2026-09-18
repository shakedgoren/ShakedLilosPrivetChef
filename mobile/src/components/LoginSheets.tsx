import React from 'react';
import { S } from './Sym';
import { INPUT_START } from '../theme/rtl';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../ui/text';
import { radius, surface } from '../theme/tokens';
import { LEGAL_DOCS, LOGIN_COPY as T } from '../screens/loginCopy';
import { Mail, Send } from './LoginIcons';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * שתי היריעות של מסך ההתחברות · התנאים ואיפוס הסיסמה.
 * ⚠ אינן מהקנבס · נוסחו בשיחה עם שקד ב-16 בספטמבר 2026.
 */

const LAV = '#BCA7E6';
const DEEP = '#43307A';

/**
 * ⚠ **המקלדת הסתירה את השדה · תוקן ב-16 בספטמבר 2026** · שקד
 * דיווחה: ״כשמקלידים מייל בשכחתי סיסמא המקלדת מסתירה את האיזור של
 * ההקלדה״. היריעה נעוצה לתחתית המסך (`justifyContent: flex-end`),
 * והמקלדת נפתחת בדיוק שם — כלומר היא כיסתה אותה במלואה.
 *
 * `KeyboardAvoidingView` מרים את היריעה בדיוק בגובה המקלדת.
 * ⚠ `padding` ב-iOS ו-`height` באנדרואיד · זו ההתנהגות הנכונה
 * לכל פלטפורמה, ו-`behavior` יחיד שובר את השנייה.
 */
function Sheet({
  children,
  onClose,
  raised = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  /**
   * נפתחת באמצע המסך ולא בתחתיתו.
   * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״הכרטיסייה חתוכה מלמטה
   * ואני לא אוהבת שזה נפתח למטה ואז עולה — שייפתח כבר אוטומטית
   * במעלה״. יריעה נמוכה נפתחת מתחת למקלדת ואז מזנקת מעליה; מהאמצע
   * היא פשוט שם מלכתחילה.
   */
  raised?: boolean;
}) {
  return (
    <View style={[s.layer, raised && s.layerMid]}>
      <Pressable style={s.scrim} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.sheet, raised && s.sheetMid]}>
          {raised ? null : <View style={s.grab} />}
          {children}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * תנאי השימוש ומדיניות הפרטיות · **כרטיסייה אחת**.
 * ⚠ שקד ביקשה במפורש מסמך אחד רציף ולא שתי לשוניות מפוצלות.
 */
export function TermsSheet({ onClose, onAgree }: { onClose: () => void; onAgree: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <Text style={s.title}>{T.termsLink}</Text>
      <Text style={s.sub}>{T.termsUpdated}</Text>
      <ScrollView style={s.doc} showsVerticalScrollIndicator={false}>
        {LEGAL_DOCS.map((d) => (
          <View key={d.title}>
            <Text style={s.docTitle}>{d.title}</Text>
            {d.sections.map((sec) => (
              <View key={sec.h}>
                <Text style={s.docH}>{sec.h}</Text>
                <Text style={s.docB}>{sec.b}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={s.tail} />
      </ScrollView>
      <Pressable onPress={onAgree} style={s.cta}>
        <Text style={s.ctaText}>{T.termsLabel}</Text>
      </Pressable>
    </Sheet>
  );
}

/**
 * איפוס סיסמה · קישור למייל.
 * ⚠ החלטה של שקד · ולכן אין כאן בורר ערוץ.
 */
export function ForgotSheet({
  email,
  onEmail,
  onSend,
  onClose,
  sent,
  busy,
}: {
  email: string;
  onEmail: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  sent: boolean;
  busy: boolean;
}) {
  return (
    /* ⚠ נפתחת באמצע · ראו `raised` */
    <Sheet onClose={onClose} raised>
      {/**
        * ⚠ **X במקום ״סגירה״ · בקשה של שקד (17 בספטמבר 2026)** ·
        * ״תמחק את ׳סגירה׳ ובמקום תוסיף x בצד שמאל למעלה״.
        * ⚠ `left` פיזי ולא `start` · היא ביקשה שמאל, ותחת RTL
        * ״התחלה״ היא ימין.
        */}
      <Pressable
        onPress={onClose}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={T.close}
        style={s.x}
      >
        <S k="close" size={13} color="#6E6478" />
      </Pressable>

      <Text style={s.title}>{T.forgotTitle}</Text>
      <Text style={s.sub}>{T.forgotBody}</Text>

      <View style={s.field}>
        <TextInput
          value={email}
          onChangeText={onEmail}
          placeholder="name@mail.com"
          placeholderTextColor="#B3ABBD"
          keyboardType="email-address"
          autoCapitalize="none"
          style={s.input}
        />
        <View style={[s.fieldIcon, NO_TOUCH]}>
          <Mail size={18} color="#9A93A6" />
        </View>
      </View>

      {/* ⚠ ברוחב מינימלי · ראו `ctaSlim` */}
      <Pressable onPress={onSend} disabled={busy} style={[s.cta, s.ctaSlim, busy && s.ctaOff]}>
        <Send size={18} color="#FFFFFF" />
        <Text style={s.ctaText}>{T.forgotCta}</Text>
      </Pressable>

      <View style={s.ttl}>
        <S k="clock" size={13} color={surface.faint} />
        <Text style={s.ttlText}>{sent ? `${T.forgotTtl} · נשלח` : T.forgotTtl}</Text>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  layer: { ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }), zIndex: 20, justifyContent: 'flex-end' },
  /* ⚠ באמצע · ראו `raised` */
  layerMid: { justifyContent: 'center', paddingHorizontal: 16 },
  scrim: { ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }), backgroundColor: 'rgba(36,28,48,0.34)' },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 22,
    boxShadow: '0 -20px 50px -24px rgba(60,44,96,0.5)',
  } as never,
  /**
   * ⚠ באמצע · פינות עגולות מכל הצדדים, והידית מיותרת.
   *
   * ⚠ **`maxHeight` בוטל כאן · 17 בספטמבר 2026** · שקד דיווחה
   * ש״תקף ל-10 דקות״ נחתך כשמקלידים מייל. הסיבה: `maxHeight: '78%'`
   * של היריעה הכללית נמדד מול הגובה **שנשאר אחרי שהמקלדת נפתחה**
   * (`KeyboardAvoidingView` ב-`padding`), ולכן השורה האחרונה נשארה
   * מחוץ לגבול ונחתכה. ליריעה הזו יש חמש שורות קבועות והיא נכנסת
   * תמיד — ולכן פשוט אין לה תקרה.
   */
  sheetMid: { maxHeight: undefined, borderRadius: 26, paddingTop: 22, paddingBottom: 26 },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.28)',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: surface.ink },
  sub: { fontSize: 12, fontWeight: '300', color: surface.faint, marginTop: 2, marginBottom: 12 },

  doc: { flexGrow: 0 },
  docTitle: { fontSize: 15, fontWeight: '700', color: surface.ink, marginTop: 16, marginBottom: 2 },
  docH: { fontSize: 13, fontWeight: '700', color: surface.ink, marginTop: 12 },
  docB: { fontSize: 12.5, fontWeight: '300', lineHeight: 21, color: surface.inkSoft },
  tail: { height: 10 },

  field: { position: 'relative', marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    paddingLeft: 14,
    paddingRight: 44,
    fontSize: 15,
    textAlign: INPUT_START,
    color: surface.ink,
  },
  /* ⚠ `right` פיזי · האייקון בקצה שאליו נכתב הטקסט */
  fieldIcon: { position: 'absolute', right: 11, top: 0, bottom: 0, justifyContent: 'center' },

  cta: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: LAV,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  /**
   * ⚠ **רוחב מינימלי · בקשה של שקד (17 בספטמבר 2026)** · ״הכפתור של
   * שליחת הקישור צריך להיות ברוחב מינמלי״. קודם הוא נמתח לכל רוחב
   * היריעה, כי זה ברירת המחדל של ילד בעמודה.
   * ⚠ חל על יריעת הסיסמה בלבד · כפתור ״הבנתי ומאשרת״ שביריעת
   * התנאים נשאר רחב, כי הוא הפעולה היחידה שם.
   */
  ctaSlim: { alignSelf: 'center', paddingHorizontal: 30 },
  ctaOff: { opacity: 0.5 },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  ttl: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 10 },
  ttlText: { fontSize: 12, color: surface.faint },
  /* ⚠ ה-X של יריעת הסיסמה · ראו ההערה ליד הכפתור */
  x: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  close: { fontSize: 12.5, color: '#8A8194', textAlign: 'center', paddingVertical: 10 },
  deep: { color: DEEP },
});

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

/**
 * ⚠ **שלושת הנוסחים האלה נכתבו על ידי Claude · 19.9.2026** · הם
 * מסך האישור שביקשה שקד, ולא היה קודם מה להעתיק ממנו.
 */
const DONE_SUB = 'שלחנו קוד לאיפוס';
const DONE_NOTE = 'הקוד תקף ל-10 דקות. אם הוא לא מגיע — כדאי לבדוק גם בתיבת הספאם.';
const DONE_AGAIN = 'לשלוח לכתובת אחרת';
/**
 * ⚠ **שלב הקוד · נכתב על ידי Claude ב-19.9.2026** · שקד בחרה קוד
 * במקום קישור (ראו `server/src/auth/resetCode.ts`), וזה המסך שבו
 * מקלידים אותו. היא לא כתבה את הנוסחים האלה.
 */
const CODE_PH = '6 ספרות מהמייל';
const PASS_PH = 'סיסמה חדשה · לפחות 8 תווים';
const PASS2_PH = 'שוב, כדי לוודא';
const SAVE_CTA = 'שמירת הסיסמה';
const SAVED_SUB = 'הסיסמה הוחלפה';
const SAVED_NOTE = 'אפשר להיכנס עכשיו עם הסיסמה החדשה.';
/** אורך מינימלי · זהה לשרת ולמסך ההרשמה */
const PASS_MIN = 8;
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
      {/* ⚠ **רוחב מצומצם ושתי שורות · בקשה של שקד (19 בספטמבר 2026)** ·
          ״הכפתור בתוך תנאי השימוש חורג מהכרטיסייה, תצמצם לו את הרוחב
          והכיתוב ייכתב באמצע על שתי שורות״. הכיתוב באורך 48 תווים
          ולא נכנס בשורה אחת ברוחב טלפון, וגובה קבוע של 52 מנע ממנו
          לגלוש לשורה שנייה — אז הוא פשוט חרג החוצה. */}
      <Pressable onPress={onAgree} style={[s.cta, s.ctaTerms]}>
        <Text style={[s.ctaText, s.ctaTextTerms]}>{T.termsLabel}</Text>
      </Pressable>
    </Sheet>
  );
}

/**
 * איפוס סיסמה · קישור למייל.
 * ⚠ החלטה של שקד · ולכן אין כאן בורר ערוץ.
 */
/** שלושת השדות של שלב הקוד */
export type ResetForm = { code: string; pass: string; pass2: string };

export function ForgotSheet({
  email,
  onEmail,
  onSend,
  onClose,
  sent,
  busy,
  err,
  onAgain,
  form,
  onField,
  onSave,
  saved,
}: {
  email: string;
  onEmail: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  /** הקוד נשלח · מציגים את שלב ההקלדה */
  sent: boolean;
  busy: boolean;
  /** שגיאה שמוצגת **בתוך** היריעה · לא על המסך שמאחוריה */
  err: string;
  /** חזרה לטופס · ״לשלוח לכתובת אחרת״ */
  onAgain: () => void;
  form: ResetForm;
  onField: (k: keyof ResetForm, v: string) => void;
  onSave: () => void;
  /** הסיסמה הוחלפה בפועל */
  saved: boolean;
}) {
  /* ⚠ אותם תנאים שהשרת אוכף · אחרת הכפתור מבטיח ונכשל */
  const ready =
    form.code.trim().length >= 4 &&
    form.pass.length >= PASS_MIN &&
    form.pass2 === form.pass;
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
      <Text style={s.sub}>{saved ? SAVED_SUB : sent ? DONE_SUB : T.forgotBody}</Text>

      {/**
        * ⚠ **מסך אישור · בקשה של שקד (19 בספטמבר 2026)** · ״לא מציג
        * שגיאה, לא מציג הצלחה, פשוט אין כלום״. עד היום השליחה שינתה
        * רק את שורת התוקף שבתחתית, באפור קטן. עכשיו הגוף מתחלף.
        *
        * ⚠ **לא נחשף אם החשבון קיים** · הנוסח מדבר על מה שנעשה
        * ולא על מה שנמצא, וזה מכוון.
        */}
      {saved ? (
        <View style={s.done}>
          <View style={s.doneOrb}>
            <S k="check" size={22} color="#FFFFFF" />
          </View>
          <Text style={s.doneNote}>{SAVED_NOTE}</Text>
        </View>
      ) : sent ? (
        /**
         * ⚠ **שלב הקוד · 19 בספטמבר 2026** · כאן היה קודם רק אישור
         * ש״נשלח קישור״, והקישור עצמו היה שבור. עכשיו זה המסך שבו
         * הלקוחה מקלידה את הקוד מהמייל ובוחרת סיסמה חדשה — הכול
         * באותה יריעה, בלי לצאת מהאפליקציה.
         */
        <View style={s.done}>
          <Text style={s.doneMail}>{email.trim()}</Text>
          <Text style={s.doneNote}>{DONE_NOTE}</Text>

          <View style={s.field}>
            <TextInput
              value={form.code}
              onChangeText={(v) => onField('code', v.replace(/[^\d]/g, '').slice(0, 6))}
              placeholder={CODE_PH}
              placeholderTextColor="#B3ABBD"
              keyboardType="number-pad"
              style={[s.input, s.bare, s.codeInput]}
            />
          </View>
          <View style={s.field}>
            <TextInput
              value={form.pass}
              onChangeText={(v) => onField('pass', v)}
              placeholder={PASS_PH}
              placeholderTextColor="#B3ABBD"
              secureTextEntry
              autoCapitalize="none"
              style={[s.input, s.bare]}
            />
          </View>
          <View style={s.field}>
            <TextInput
              value={form.pass2}
              onChangeText={(v) => onField('pass2', v)}
              placeholder={PASS2_PH}
              placeholderTextColor="#B3ABBD"
              secureTextEntry
              autoCapitalize="none"
              style={[s.input, s.bare]}
            />
          </View>

          {err ? <Text style={s.sheetErr}>{err}</Text> : null}

          <Pressable
            onPress={onSave}
            disabled={busy || !ready}
            style={[s.cta, s.ctaSlim, (busy || !ready) && s.ctaOff]}
          >
            <S k="check" size={17} color="#FFFFFF" />
            <Text style={s.ctaText}>{SAVE_CTA}</Text>
          </Pressable>

          <Pressable onPress={onAgain} hitSlop={8}>
            <Text style={s.doneAgain}>{DONE_AGAIN}</Text>
          </Pressable>
        </View>
      ) : (
      <>
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

      {err ? <Text style={s.sheetErr}>{err}</Text> : null}

      {/* ⚠ ברוחב מינימלי · ראו `ctaSlim` */}
      <Pressable onPress={onSend} disabled={busy} style={[s.cta, s.ctaSlim, busy && s.ctaOff]}>
        <Send size={18} color="#FFFFFF" />
        <Text style={s.ctaText}>{T.forgotCta}</Text>
      </Pressable>

      <View style={s.ttl}>
        <S k="clock" size={13} color={surface.faint} />
        <Text style={s.ttlText}>{T.forgotTtl}</Text>
      </View>
      </>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  layer: { ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }), zIndex: 20, justifyContent: 'flex-end' },
  /* ⚠ באמצע · ראו `raised` */
  /**
   * ⚠ **גבוה יותר מהאמצע · בקשה של שקד (19 בספטמבר 2026)** · ״את
   * הכרטיסייה עצמה של איפוס סיסמא תעלה יותר למעלה בדף״.
   * ⚠ `flex-start` עם ריפוד ולא `center` · במרכז היא ירדה עם גובה
   * המסך, וכאן היא תמיד באותו מרחק מהראש.
   */
  layerMid: { justifyContent: 'flex-start', paddingTop: 110, paddingHorizontal: 16 },
  scrim: { ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }), backgroundColor: 'rgba(36,28,48,0.34)' },
  /* ⚠ הקוד באמצע ומרווח · ספרות נקראות כך הרבה יותר טוב */
  codeInput: { textAlign: 'center', letterSpacing: 6, fontSize: 18, fontWeight: '600' },
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

  /* ⚠ `stretch` · בתוך `done` ההורה ממרכז, ובלעדיו כל שדה
     מתכווץ לרוחב הכיתוב שלו · נמדד על המסך */
  field: { position: 'relative', marginBottom: 6, alignSelf: 'stretch' },
  /* ⚠ שדה בלי אייקון · בלי המקום שנשמר לו בצד */
  bare: { paddingRight: 14 },
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
  /**
   * ⚠ **כפתור התנאים · ראו את ההערה ליד הכפתור עצמו** · בלי גובה
   * קבוע הוא גדל לפי הכיתוב, ו-`maxWidth` שומר אותו בתוך היריעה.
   */
  ctaTerms: {
    height: undefined,
    alignSelf: 'center',
    maxWidth: '88%',
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  ctaTextTerms: { textAlign: 'center', lineHeight: 20, flexShrink: 1 },
  ctaOff: { opacity: 0.5 },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  ttl: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 10 },
  ttlText: { fontSize: 12, color: surface.faint },
  sheetErr: { fontSize: 12.5, color: '#B95349', textAlign: 'center', marginTop: 8 },

  /* מסך האישור · ראו את ההערה ליד הגוף */
  done: { alignItems: 'center', gap: 8, paddingTop: 6, paddingBottom: 2 },
  doneOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6FAF84',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneMail: { fontSize: 15, fontWeight: '700', color: DEEP, marginTop: 2 },
  doneNote: { fontSize: 12.5, fontWeight: '300', lineHeight: 19, color: surface.inkSoft, textAlign: 'center' },
  doneAgain: { fontSize: 13, fontWeight: '600', color: DEEP, marginTop: 4 },
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

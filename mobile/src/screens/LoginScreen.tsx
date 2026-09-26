import React, { useCallback, useEffect, useRef, useState } from 'react';
import { INPUT_START } from '../theme/rtl';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../ui/text';
import { radius, space, surface } from '../theme/tokens';
import { useNav } from '../navigation/store';
import { apiEnabled } from '../api/config';
import {
  forgotPassword,
  resetPassword,
  googleSignIn,
  login,
  me,
  register,
  registerPhone,
  registerVerify,
} from '../api/auth';
import { authError, COPY } from '../api/copy';
import { ApiError, type Session } from '../api/types';
import { BlobField } from '../components/BlobField';
import { Photo } from '../components/Photo';
import { EyeToggle } from '../components/EyeToggle';
import { ForgotSheet, TermsSheet, type ResetForm } from '../components/LoginSheets';
import { GoogleG, WhatsApp } from '../components/LoginIcons';
import { S, SymEnvelope, SymUser } from '../components/Sym';
/**
 * ⚠ **כלל הסיסמה ממקום אחד · 26 בספטמבר 2026** · `PASS_MIN` הגיע
 * עד היום מ-`data/login`, שנוצר אוטומטית מהקנבס — ושם יש רק אורך.
 * הכלל של שקד דורש גם אות גדולה, אות קטנה וספרה, ולכן הוא חי
 * עכשיו ב-`auth/passwordRule` שגם השרת מייבא.
 */
import { PASS_MIN, isStrongPassword, passwordProblems } from '../auth/passwordRule';
import {
  disarmFace,
  enrollFace,
  faceArmed,
  faceAvailable,
  unlockWithFace,
  type EnrollWhy,
} from '../lib/faceUnlock';
import { maskPhone, normalizePhone } from '../lib/phone';
import { useGoogleIdToken } from '../lib/googleAuth';
import { DISPLAY_FAMILY } from '../theme/fonts';
import { LOGIN_COPY as T } from './loginCopy';
import { iconOrbShadow } from '../theme/glass';
import { NO_TOUCH } from '../theme/pointerEvents';
import {
  BRAND,
  BRAND_SUB,
  CTA_IN,
  CTA_UP,
  FORGOT_LABEL,
  GOOGLE_LABEL,
  GUEST_LABEL,
  OR_LABEL,
  TAB_IN,
  TAB_UP,
} from '../data/login';

/**
 * מסך ההתחברות · עיצוב ״שכבות״.
 *
 * ⚠ **לא מהקנבס** · שקד אישרה אותו ב-16 בספטמבר 2026 אחרי ארבעה
 * סבבי תצוגות. הרקע ב-`BlobField`, הנוסח ב-`loginCopy.ts`, ומה
 * שכן מגיע מהקנבס (שם המותג, תוויות הכפתורים) מיובא מ-`data/login`.
 *
 * הזרימה שקבעה: כניסה בטלפון וסיסמה · אחרי הכניסה הראשונה מוצע
 * זיהוי פנים · הרשמה מתחילה באימות טלפוני בוואטסאפ ורק אחר כך
 * ממלאים פרטים.
 */

type Step = 'in' | 'face' | 'ask' | 'up1' | 'up2' | 'up3';
type Gender = '' | 'male' | 'female' | 'other';

const LAV = '#BCA7E6';
const DEEP = '#43307A';
const PLUM = '#7B5CBC';
const OTP_LEN = 6;

/**
 * ⚠ **הכפתור כבוי עד שהשדות תקינים** · בלי זה לחיצה על ״שליחת קוד״
 * עם שדה ריק יוצאת לשרת, חוזרת 400, והמשתמשת רואה ״לא ניתן להתחבר
 * כרגע״ — הודעה שמאשימה את הרשת במקום להצביע על השדה. נמדד בדפדפן.
 */
const okPhone = (v: string) => /^0(5\d|[2-4,8-9])-?\d{7}$/.test(v.trim().replace(/\s/g, ''));
const okMail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** ⚠ הסמלים שבחרה שקד · שפם, פה ומוח */
const GENDERS = [
  { key: 'male', label: T.gMale, sym: 'male' },
  { key: 'female', label: T.gFemale, sym: 'female' },
  { key: 'other', label: T.gOther, sym: 'other' },
] as const satisfies readonly { key: Exclude<Gender, ''>; label: string; sym: 'male' | 'female' | 'other' }[];

/**
 * ⚠ **מוגדר מחוץ לרכיב, ובכוונה** · כשהוא היה בתוך `LoginScreen`
 * ריאקט יצר טיפוס רכיב חדש בכל רינדור, פירק את ה-`TextInput` והרכיב
 * אותו מחדש — והשדה איבד פוקוס אחרי כל תו. נמדד בדפדפן: הקלדת
 * מספר טלפון שלם השאירה את הכפתור כבוי, כי רק תו אחד נשמר.
 */
function Field({
  label,
  value,
  onChange,
  placeholder,
  Icon,
  sym,
  secure,
  eye,
  keyboard,
  locked,
  onPress,
  showPass,
  onEye,
  onBlur,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder: string;
  /**
   * ⚠ **טיפוס רכיב ולא `typeof`** · השדה מקבל גם סמל אמיתי
   * (`SymUser`) וגם אייקון מותג (`Mail`, `GoogleG`), ולשני
   * הסוגים אין חתימה זהה. `typeof SymUser` דרש `displayName`
   * ופסל את אייקוני המותג.
   */
  Icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  sym?: 'phone' | 'lock';
  secure?: boolean;
  eye?: boolean;
  keyboard?: 'phone-pad' | 'email-address';
  locked?: boolean;
  onPress?: () => void;
  showPass: boolean;
  onEye: () => void;
  onBlur?: () => void;
}) {
  return (
    <View style={s.fieldBlock}>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={onPress} disabled={!onPress}>
        <TextInput
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          editable={!locked && !onPress}
          placeholder={placeholder}
          placeholderTextColor="#B3ABBD"
          secureTextEntry={secure && !showPass}
          keyboardType={keyboard ?? 'default'}
          autoCapitalize="none"
          style={[s.input, locked && s.inputLocked, eye && s.inputEye]}
        />
        <View style={[s.fieldIcon, NO_TOUCH]}>
          {sym ? <S k={sym} size={18} /> : Icon ? <Icon size={18} color="#9A93A6" strokeWidth={1.8} /> : null}
        </View>
        {eye ? (
          <View style={s.eye}>
            <EyeToggle shown={showPass} onToggle={onEye} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function Dots({ at }: { at: number }) {
  return (
    <View style={s.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.dot, i === at && s.dotOn, i < at && s.dotDone]} />
      ))}
    </View>
  );
}

/**
 * ⚠ **מה בדיוק נכשל בזיהוי הפנים · 19 בספטמבר 2026** · שקד דיווחה
 * שלוש פעמים על ״לא ניתן לסרוק את הפנים״, ובכל פעם ההודעה הייתה
 * אותה הודעה כללית — גם כשהסיבה הייתה אחרת לגמרי. כאן כל סיבה
 * מקבלת את ההסבר שלה, וממילא גם אני רואה מהמסך מה קרה.
 * הנוסחים ב-`loginCopy` · נכתבו על ידי Claude.
 */
const FACE_HELP: Record<EnrollWhy, string> = {
  cancel: '',
  notEnrolled: T.faceNoEnroll,
  denied: T.faceDenied,
  noPasscode: T.faceNoPasscode,
  lockout: T.faceLockout,
  failed: T.faceFailed,
};

/** לאלה הפתרון נמצא בהגדרות המכשיר · ולכן מוצג הקישור אליהן */
const FACE_SETTINGS = new Set<EnrollWhy>(['notEnrolled', 'denied', 'noPasscode']);

export function LoginScreen({ mode }: { mode: 'in' | 'up' }) {
  const { go, signIn, closeLogin, loginOverlay } = useNav();
  /* ⚠ חייב להיקרא בראש הרכיב · זה הוק · ראו `lib/googleAuth.ts` */
  const google = useGoogleIdToken();
  const [step, setStep] = useState<Step>(mode === 'up' ? 'up1' : 'in');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  /* ⚠ למה הגדרת זיהוי הפנים נכשלה · null = אין מה להגיד */
  const [faceHelp, setFaceHelp] = useState<EnrollWhy | null>(null);
  const [showPass, setShowPass] = useState(false);

  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [code, setCode] = useState('');
  const [gender, setGender] = useState<Gender>('');
  /* ⚠ שגיאת יריעת האיפוס · נפרדת מ-`err` של המסך שמאחוריה */
  const [resetErr, setResetErr] = useState('');

  const [terms, setTerms] = useState(false);
  /* ⚠ אי אפשר לאשר לפני שפותחים · בקשה מפורשת של שקד */
  const [read, setRead] = useState(false);
  const [sheet, setSheet] = useState<null | 'doc' | 'forgot'>(null);
  const [resetMail, setResetMail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  /* ⚠ שלב הקוד · ראו `server/src/auth/resetCode.ts` */
  const [resetForm, setResetForm] = useState<ResetForm>({ code: '', pass: '', pass2: '' });
  const [resetDone, setResetDone] = useState(false);

  /** האם כבר נשמר אסימון · אז לחיצה על הסיסמה פותחת סריקה */
  const [armed, setArmed] = useState(false);
  /** הסשן ממתין בזמן שמציעים זיהוי פנים · עוד לא נכנסנו */
  const pending = useRef<Session | null>(null);

  useEffect(() => {
    let alive = true;
    void faceArmed().then((v) => alive && setArmed(v));
    return () => {
      alive = false;
    };
  }, []);

  /**
   * ⚠ **הטלפון מתוקן לפורמט אחד** · בקשה של שקד (16 בספטמבר 2026).
   * המסכה רצה בכל תו ורק מכניסה מקף; הנרמול המלא — קידומת ‎+972
   * ואפס חסר — רץ כשיוצאים מהשדה, כדי לא להזיז ספרות תוך כדי הקלדה.
   */
  const onPhone = (v: string) => setPhone(maskPhone(v));
  const onPhoneDone = () => setPhone((v) => normalizePhone(v));

  const isUp = step === 'up1' || step === 'up2' || step === 'up3';
  const fail = (e: unknown, fallback = COPY.net) =>
    setErr(e instanceof ApiError ? authError(e.code, e.message) : fallback);

  /** אחרי כניסה מוצלחת · מציעים זיהוי פנים רק אם יש חומרה וטרם הוגדר */
  const afterLogin = useCallback(
    async (session: Session) => {
      if (await faceAvailable()) {
        if (!(await faceArmed())) {
          pending.current = session;
          setStep('ask');
          return;
        }
      }
      signIn(session);
    },
    [signIn],
  );

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const onLogin = () =>
    run(async () => {
      if (!apiEnabled) return signIn();
      await afterLogin(await login(phone.trim(), pass));
    });

  /**
   * ⚠ **התחברות אמיתית · 16 בספטמבר 2026** · בקשה של שקד. קודם
   * נשלח טוקן ריק (`googleStub`) והשרת החזיר 501 — הכפתור נראה
   * ולא עבד. ראו `lib/googleAuth.ts` למזהים שצריך להגדיר.
   * ⚠ בלי מזהים הכפתור מושבת, במקום להיכשל בשקט.
   */
  const onGoogle = () =>
    run(async () => {
      if (!apiEnabled) return signIn();
      try {
        const idToken = await google.signIn();
        /* ביטול · הלקוחה סגרה את חלון גוגל */
        if (!idToken) return;
        await afterLogin(await googleSignIn(idToken));
      } catch (e) {
        fail(e, COPY.google);
      }
    });

  /** לחיצה על שדה הסיסמה כשזיהוי פנים מוגדר · בלי שום כיתוב שמסביר */
  const onPassPress = () => {
    if (!armed) return;
    setStep('face');
    void (async () => {
      const token = await unlockWithFace();
      if (!token) {
        setStep('in');
        return;
      }
      try {
        const { user } = await me(token);
        signIn({ token, user });
      } catch {
        setStep('in');
        setErr(COPY.net);
      }
    })();
  };

  /**
   * ⚠ **שני מסלולים נפרדים · 18 בספטמבר 2026** · שקד דיווחה על
   * שתי תקלות באותה חלונית.
   *
   * ״לא עכשיו״ — ״לא סוגר ומעביר לדף הבית במהירות הנדרשת״. הוא רץ
   * דרך `run`, שמדליק ומכבה מצב עסוק ומוסיף שני רינדורים לפני
   * שהמסך בכלל מתחיל לזוז. כאן אין מה להמתין לו: הכניסה כבר
   * הצליחה, והאסימון כבר ביד. לכן הוא נכנס **מיד**, בלי עטיפה.
   *
   * ״כן, להגדיר״ — ״לא מעביר להגדיר את הזיהוי פנים, מעביר לדף
   * הבית״. ראו `enrollFace`: עכשיו נפתחת חלונית הסריקה של המערכת,
   * וההגדרה נשמרת רק אחרי שהפנים נסרקו.
   */
  const onArm = (yes: boolean) => {
    const session = pending.current;
    pending.current = null;
    if (!yes) {
      /* ⚠ בלי הפעלה · נכנסים מיד · ראו ההערה למעלה */
      if (session) signIn(session);
      else setStep('in');
      return;
    }
    void run(async () => {
      if (!session) {
        setStep('in');
        return;
      }
      const res = await enrollFace(session.token);
      if (res.ok) {
        signIn(session);
        return;
      }
      /**
       * ⚠ **נשארים על החלונית · 18 בספטמבר 2026** · קודם המסך
       * התעלם מהתשובה ונכנס הביתה בכל מקרה, ולכן שקד דיווחה
       * ש״לוחצים כן וזה פשוט מעביר לדף הבית״. עכשיו היא רואה מה
       * קרה ויכולה לנסות שוב או להיכנס בלי זיהוי פנים.
       */
      pending.current = session;
      setFaceHelp(res.why === 'cancel' ? null : res.why);
    });
  };

  /** פתיחת הגדרות המכשיר · שם מפעילים את זיהוי הפנים לאפליקציה */
  const openSettings = () => {
    void Linking.openSettings().catch(() => undefined);
  };

  const onSendCode = () =>
    run(async () => {
      /**
       * ⚠ **מילוי הקוד בפיתוח בלבד · 19 בספטמבר 2026** · קוד
       * האימות נשלח **רק בוואטסאפ**. כל עוד אין `WHATSAPP_TOKEN`
       * אי אפשר להירשם כלקוחה בכלל — לא בסימולטור ולא באוויר.
       *
       * השרת כבר מחזיר את הקוד בתשובה כש-`RESET_DEBUG=1`, אבל
       * המסך התעלם ממנו, ולכן גם בפיתוח ההרשמה נתקעה.
       *
       * ⚠ **לא ידלוף לפרודקשן** · `resetDebug` כבוי בכוח כש-
       * `NODE_ENV=production` (ראו `env.ts`), ולכן שם השדה `code`
       * פשוט אינו קיים בתשובה והתנאי הזה לא מתקיים לעולם.
       */
      const sent = apiEnabled ? await registerPhone(phone.trim()) : null;

      /**
       * ⚠ **כישלון שליחה נעצר כאן · 26 בספטמבר 2026** · שקד:
       * ״זה עדיין לא שולח סיסמא בוואטצפ לאימות״. המסך התעלם
       * מ-`sent` והמשיך למסך ״הקלידי את הקוד״ בכל מקרה — כלומר
       * הלקוחה ישבה מול בקשה לקוד שמעולם לא יצא.
       *
       * ⚠ **לא ממשיכים** · בלי הקוד אין מה להקליד, ומסך הקלדה
       * הוא הבטחה שאי אפשר לקיים. נשארים כאן, והלקוחה יכולה
       * לנסות שוב או לפנות ישירות.
       */
      if (sent && sent.sent === false && !sent.code) {
        setErr(COPY.otpNotSent);
        return;
      }

      setCode(sent?.code ?? '');
      setStep('up2');
    });

  const onVerify = () =>
    run(async () => {
      if (apiEnabled) await registerVerify(phone.trim(), code.trim());
      setStep('up3');
    });

  const onRegister = () =>
    run(async () => {
      if (!apiEnabled) return signIn();
      /* ⚠ המייל והמגדר בתוך ההרשמה · ראו `register` */
      const session = await register(phone.trim(), pass, name.trim(), {
        email: mail.trim() || null,
        gender,
      });
      signIn(session);
    });

  /**
   * ⚠ **תשובה אמיתית · בקשה של שקד (19 בספטמבר 2026)** · ״כשאני
   * שולחת איפוס סיסמא למייל לא נעשה כלום, לא מציג שגיאה, לא מציג
   * הצלחה, פשוט אין כלום״. היא צודקת: הדבר היחיד שהשתנה היה
   * שורת ״תקף ל-10 דקות״ שקיבלה ״· נשלח״ בסוף, באפור קטן.
   * עכשיו היריעה מחליפה גוף ואומרת לאן נשלח.
   */
  const onForgot = () =>
    run(async () => {
      if (!okMail(resetMail)) {
        setResetErr('כתובת אימייל לא תקינה');
        return;
      }
      setResetErr('');
      /**
       * ⚠ **״נשלח״ רק כשבאמת נשלח · 19 בספטמבר 2026** · בקשה של
       * שקד: ״הוא לא באמת שולח שום הודעת איפוס למייל, רק מציג
       * התראה ששלח״. השרת מחזיר עכשיו 502 כששרת המייל נכשל, וכאן
       * זה נכנס ליריעה עצמה ולא לשורת השגיאה שמאחוריה.
       */
      if (apiEnabled) {
        try {
          await forgotPassword(resetMail.trim());
        } catch (e) {
          setResetErr(e instanceof ApiError ? authError(e.code, e.message) : COPY.net);
          return;
        }
      }
      setResetSent(true);
    });

  /**
   * ⚠ **בחירת סיסמה חדשה · 19 בספטמבר 2026** · שקד בחרה קוד במייל
   * במקום קישור. כל השלב קורה בתוך היריעה, ולכן גם השגיאה נשארת
   * בתוכה ולא נוחתת על המסך שמאחוריה.
   */
  const onResetSave = () =>
    run(async () => {
      setResetErr('');
      if (!apiEnabled) {
        setResetDone(true);
        return;
      }
      try {
        await resetPassword(resetMail.trim(), resetForm.code.trim(), resetForm.pass);
        setResetDone(true);
      } catch (e) {
        setResetErr(e instanceof ApiError ? authError(e.code, e.message) : COPY.net);
      }
    });

  /** חזרה לטופס הכתובת · ״לשלוח לכתובת אחרת״ */
  const onResetAgain = () => {
    setResetSent(false);
    setResetDone(false);
    setResetErr('');
    setResetForm({ code: '', pass: '', pass2: '' });
  };

  const onLogout = () => void disarmFace();
  useEffect(() => onLogout, []);

  /* ---------- גוף לפי שלב ---------- */
  let body: React.ReactNode = null;

  if (step === 'in') {
    body = (
      <>
        <Field label="טלפון" value={phone} onChange={onPhone} onBlur={onPhoneDone} placeholder="050-0000000" sym="phone" keyboard="phone-pad" showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        <Field
          label="סיסמה"
          value={pass}
          onChange={setPass}
          placeholder={`לפחות ${PASS_MIN} תווים`}
          sym="lock"
          secure
          eye={!armed}
          onPress={armed ? onPassPress : undefined}
        showPass={showPass} onEye={() => setShowPass((v) => !v)} />
      </>
    );
  } else if (step === 'face') {
    /* ⚠ **בלי אות אחת** · בקשה מפורשת של שקד · רק הפנים */
    body = (
      <Pressable onPress={() => setStep('in')} style={s.faceWrap}>
        <S k="faceId" size={124} />
      </Pressable>
    );
  } else if (step === 'ask') {
    body = (
      <View style={s.faceWrap}>
        <View style={s.ring}>
          <S k="faceId" size={40} />
        </View>
        <Text style={s.askTitle}>{T.faceAsk}</Text>
        {/* ⚠ **רחב על פני כל הרוחב** · שקד ביקשה (16 בספטמבר 2026)
            להרחיב את ״כן להגדיר״. המכל ממורכז, ולכן הכפתור התכווץ
            לרוחב הכיתוב בלבד. */}
        <Pressable onPress={() => onArm(true)} style={[s.cta, s.askCta]}>
          <S k="check" size={18} color="#FFFFFF" />
          <Text style={s.ctaText}>{T.faceYes}</Text>
        </Pressable>
        {/* ⚠ **בלי מסגרת** · שקד ביקשה ש״לא עכשיו״ יהיה ״פשוט כתוב
            וניתן ללחיצה״. הוסרו הרקע הלבן והמסגרת. האייקון נשאר —
            היא ביקשה אייקונים ליד כן ולא, וזו בקשה קודמת שלה. */}
        <Pressable onPress={() => onArm(false)} style={s.askGhost}>
          <S k="clock" size={17} color="#6E6480" />
          <Text style={s.ghostText}>{T.faceNo}</Text>
        </Pressable>
        {/* ⚠ **למה זה לא עבד** · ראו ההערה ב-`onArm`. הנוסחים
            נכתבו על ידי Claude · ראו `loginCopy`. */}
        {faceHelp ? (
          <>
            <Text style={s.faceHelp}>{FACE_HELP[faceHelp]}</Text>
            {/* ⚠ קישור להגדרות רק כשהפתרון באמת נמצא שם */}
            {FACE_SETTINGS.has(faceHelp) ? (
              <Pressable onPress={openSettings} style={s.askGhost}>
                <Text style={s.faceLink}>{T.faceSettings}</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>
    );
  } else if (step === 'up1') {
    body = (
      <>
        <Dots at={0} />
        <Text style={s.stepTitle}>{T.verifyTitle}</Text>
        <Field label="טלפון" value={phone} onChange={onPhone} onBlur={onPhoneDone} placeholder="050-0000000" sym="phone" keyboard="phone-pad" showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        <View style={s.waRow}>
          <View style={s.waPill}>
            <WhatsApp size={14} />
            <Text style={s.waText}>וואטסאפ</Text>
          </View>
        </View>
      </>
    );
  } else if (step === 'up2') {
    body = (
      <>
        <Dots at={1} />
        <Text style={s.stepTitle}>{T.otpTitle}</Text>
        <Text style={s.lede}>{T.otpBody}</Text>
        <View style={s.otpRow}>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, OTP_LEN))}
            keyboardType="number-pad"
            style={s.otpInput}
            maxLength={OTP_LEN}
            autoFocus
          />
          {Array.from({ length: OTP_LEN }, (_, i) => (
            <View key={i} style={[s.otpBox, i === code.length && s.otpBoxOn, i < code.length && s.otpBoxFull]}>
              <Text style={s.otpDigit}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </View>
        <View style={s.waRow}>
          <View style={s.waPill}>
            <WhatsApp size={14} />
            <Text style={s.waText}>{phone || '—'}</Text>
          </View>
        </View>
        <Pressable onPress={onSendCode}>
          <Text style={s.link}>{T.otpAgain}</Text>
        </Pressable>
      </>
    );
  } else {
    body = (
      <>
        <Dots at={2} />
        <Field label="טלפון" value={phone} placeholder="050-0000000" sym="phone" locked showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        <Field label="שם מלא" value={name} onChange={setName} placeholder="שם ושם משפחה" Icon={SymUser} showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        <Field label="אימייל" value={mail} onChange={setMail} placeholder="name@mail.com" Icon={SymEnvelope} keyboard="email-address" showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        <Field label="סיסמה" value={pass} onChange={setPass} placeholder={`לפחות ${PASS_MIN} תווים`} sym="lock" secure eye showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        {/* ⚠ **רמז חי · בקשת הסיסמה החזקה** · בלעדיו הכפתור פשוט
            כבוי והלקוחה לא יודעת מה חסר. מופיע רק אחרי שהתחילה
            להקליד, כדי לא לקדם אותה באזהרה על שדה ריק. */}
        {pass !== '' && !isStrongPassword(pass) ? (
          <Text style={s.passMissing}>חסר: {passwordProblems(pass).join(' · ')}</Text>
        ) : null}

        <Field label="אימות הסיסמה" value={pass2} onChange={setPass2} placeholder="שוב, בדיוק אותו דבר" sym="lock" secure showPass={showPass} onEye={() => setShowPass((v) => !v)} />

        <Text style={s.label}>{T.gender}</Text>
        <View style={s.genders}>
          {GENDERS.map((g) => {
            const on = gender === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => setGender(on ? '' : g.key)}
                style={[s.gender, on && s.genderOn]}
              >
                <S k={g.sym} size={23} />
                <Text style={[s.genderText, on && s.genderTextOn]}>{g.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => read && setTerms((v) => !v)}
          disabled={!read}
          style={[s.terms, !read && s.termsLocked]}
        >
          <View style={[s.box, terms && s.boxOn]}>
            {terms ? <S k="check" size={12} color="#FFFFFF" /> : null}
          </View>
          <View style={s.grow}>
            <Text style={s.termsText}>
              קראתי ואני מאשר.ת את{' '}
              <Text style={s.termsLink} onPress={() => { setRead(true); setSheet('doc'); }}>
                {T.termsLink}
              </Text>
            </Text>
            {!read ? (
              <View style={s.needRow}>
                <S k="lock" size={12} />
                <Text style={s.needText}>{T.termsNeed}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </>
    );
  }

  /* מתי מותר להמשיך · לכל שלב התנאי שלו */
  const ready =
    step === 'in'
      ? okPhone(phone) && isStrongPassword(pass)
      : step === 'up1'
        ? okPhone(phone)
        : step === 'up2'
          ? code.length === OTP_LEN
          : step === 'up3'
            ? name.trim() !== '' &&
              okMail(mail) &&
              isStrongPassword(pass) &&
              pass2 === pass &&
              terms
            : true;

  const ctaLabel =
    step === 'up1' ? T.sendCode : step === 'up2' ? T.otpCta : step === 'up3' ? CTA_UP : CTA_IN;
  const onCta =
    step === 'up1' ? onSendCode : step === 'up2' ? onVerify : step === 'up3' ? onRegister : onLogin;
  const showCta = step !== 'ask' && step !== 'face';
  /* ⚠ בשלב הקוד אין שורת קישורים · בקשה של שקד */
  /**
   * ⚠ **לא בחלונית זיהוי הפנים · בקשה של שקד (19 בספטמבר 2026)** ·
   * ״אם התחברנו כבר וזה שואל אותנו על הזיהוי פנים, לא צריך לראות
   * למטה את ׳שכחתי סיסמא, הרשמה, להסתכל בלי חשבון׳ — אנחנו כבר
   * מחוברים״. היא צודקת: בשלב `ask` הכניסה כבר הצליחה והאסימון
   * ביד, ושלושת הקישורים האלה שייכים למי שעוד לא נכנס.
   */
  const showLinks = step !== 'up2' && step !== 'face' && step !== 'ask';
  /**
   * ⚠ **רק בשלב `ask`** · ״להסתכל בלי חשבון״ ממשיך להופיע בשלב
   * הקוד ובסריקה, כי שם עוד לא נכנסנו. הנימוק שלה — ״אנחנו כבר
   * מחוברים״ — נכון לחלונית הזאת בלבד.
   */
  const showGuest = step !== 'ask';

  return (
    <View style={s.page}>
      <BlobField />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ⚠ **נעול כשיריעה פתוחה · בקשה של שקד (19 בספטמבר 2026)** ·
            ״המסך מאחורה עולה אחורה והוא לא צריך להעלות, כי הוא במצב
            שהוא לא קשור בכלל למה שקורה״. המקלדת של היריעה פתחה גם
            את ה-`KeyboardAvoidingView` של המסך שמתחת, והוא נגלל. */}
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={!sheet}
        >
          <View style={s.brandBlock}>
            {/**
              * ⚠ **הלוגו · בחירה של שקד (19 בספטמבר 2026)** · היא
              * ראתה שבע אפשרויות בתצוגה מקדימה ובחרה את הראשונה:
              * הסמל מעל הכיתוב ״BITE & TELL״, במסך ההתחברות.
              *
              * ⚠ **הכיתוב נשאר** · הלוגו מכיל את שם העסק בתוכו,
              * אבל היא ביקשה במפורש את האופציה שבה שניהם מופיעים.
              * ⚠ **בלי הגדלה בלחיצה** · `zoom={false}` · זו כותרת
              * ולא תמונה של אוכל שיש טעם לפתוח.
              */}
            <Photo name="logo" style={s.logo} zoom={false} resizeMode="contain" />
            <Text style={s.brand}>{BRAND}</Text>
            <Text style={s.brandSub}>{BRAND_SUB}</Text>
          </View>

          <View style={s.card}>
            {body}
            {showCta ? (
              <Pressable
                onPress={onCta}
                disabled={busy || !ready}
                style={[s.cta, (busy || !ready) && s.ctaOff]}
              >
                <Text style={s.ctaText}>{ctaLabel}</Text>
              </Pressable>
            ) : null}
            {step === 'in' ? (
              <>
                <View style={s.orRow}>
                  <View style={s.orLine} />
                  <Text style={s.orText}>{OR_LABEL}</Text>
                  <View style={s.orLine} />
                </View>
                {/**
                  * ⚠ **כפתור גוגל אמיתי · בקשה של שקד (19 בספטמבר
                  * 2026)** · ״העיצוב של הכניסה עם גוגל לא נראה כמו
                  * שהוא אמור להראות עם הצבע של גוגל״. הוא היה טקסט
                  * אפור בלי סמל.
                  *
                  * ⚠ **המידות של גוגל** · לבן, מסגרת #747775, כיתוב
                  * #1F1F1F, וסמל 18. כך הוא מוגדר במסמכי המותג,
                  * וזה מה שמותר להציג.
                  */}
                <Pressable
                  onPress={onGoogle}
                  disabled={busy || (apiEnabled && !google.ready)}
                  style={[s.gbtn, apiEnabled && !google.ready && s.ghostOff]}
                >
                  <GoogleG size={18} />
                  <Text style={s.gbtnText}>{GOOGLE_LABEL}</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {err ? <Text style={s.err}>{err}</Text> : null}

          {showLinks ? (
            <View style={s.links}>
              {!isUp ? (
                <Pressable onPress={() => { onResetAgain(); setSheet('forgot'); }}>
                  {/* ⚠ בבולט · בקשה של שקד */}
                  <Text style={s.linkStrong}>{FORGOT_LABEL}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setStep(isUp ? 'in' : 'up1')}>
                <Text style={s.linkStrong}>{isUp ? TAB_IN : TAB_UP}</Text>
              </Pressable>
            </View>
          ) : null}

          {/* ⚠ **גם ״להסתכל בלי חשבון״ · ראו `showGuest`** · הוא ישב
              מחוץ לגוש הקישורים ולכן נשאר על המסך כשהשאר נעלמו. */}
          {showGuest ? (
            <Pressable onPress={() => (loginOverlay ? closeLogin() : go('guest'))}>
              <Text style={s.link}>{GUEST_LABEL}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {sheet === 'doc' ? (
        <TermsSheet onClose={() => setSheet(null)} onAgree={() => { setTerms(true); setRead(true); setSheet(null); }} />
      ) : null}
      {sheet === 'forgot' ? (
        <ForgotSheet
          email={resetMail}
          onEmail={(v) => { setResetMail(v); setResetErr(''); }}
          onSend={onForgot}
          onClose={() => setSheet(null)}
          sent={resetSent}
          busy={busy}
          err={resetErr}
          onAgain={onResetAgain}
          form={resetForm}
          onField={(k, v) => { setResetForm((f) => ({ ...f, [k]: v })); setResetErr(''); }}
          onSave={onResetSave}
          saved={resetDone}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.xl, paddingVertical: 40 },

  /**
   * ⚠ **הוגדל והוכהה · 16 בספטמבר 2026** · שקד דיווחה על ״בעיה
   * בנראות של הדף״. נמדד בסימולטור: גוש השם יושב **על הכתם הסגול**,
   * והכיתוב שמתחתיו היה `surface.faint` במשקל 300 — אפור בהיר על
   * סגול, כמעט בלתי קריא.
   * השם 21 → 26, והכיתוב עבר לדיו הרך במשקל 400.
   */
  brandBlock: { alignItems: 'center', marginBottom: 14 },
  /* ⚠ **הלוגו החדש ריבועי · 23 בספטמבר 2026** · הקובץ הקודם היה
     180×176 ולכן הקופסה כאן הייתה 96×94. הייצוא של שקד הוא
     1254×1254, והקופסה חזרה להיות ריבוע כדי שלא יישאר פס ריק. */
  logo: { width: 96, height: 96, marginBottom: 8 },
  /* ⚠ שם המשפחה ולא 'Anton' · ב-React Native כל משקל הוא משפחה נפרדת */
  brand: { fontFamily: DISPLAY_FAMILY, fontSize: 26, letterSpacing: 1.3, color: surface.ink },
  brandSub: { fontSize: 13, fontWeight: '400', color: surface.inkSoft, marginTop: 3 },

  /* ⚠ כרטיס אטום · הכתם עובר ממש מאחוריו וזכוכית שקופה הופכת את הטקסט לבלתי קריא */
  card: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: 'inset 0 1.5px 0 #FFFFFF, 0 34px 60px -28px rgba(96,80,132,0.8)',
  } as never,

  fieldBlock: { marginBottom: 11 },
  /* ⚠ יושב מעל שדה האימות · ראו הרמז החי */
  passMissing: { fontSize: 11.5, color: '#B95349', marginTop: -6, marginBottom: 9 },
  label: { fontSize: 11, fontWeight: '500', color: surface.faint, marginBottom: 4 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    paddingLeft: 14,
    paddingRight: 44,
    fontSize: 15,
    textAlign: INPUT_START,
    color: surface.ink,
  },
  inputLocked: { backgroundColor: 'rgba(130,112,162,0.07)', color: '#8A8194' },
  inputEye: { paddingLeft: 42 },
  /* ⚠ `right` פיזי · האייקון בקצה שאליו נכתב הטקסט, בשתי הפלטפורמות */
  fieldIcon: { position: 'absolute', right: 11, top: 0, bottom: 0, justifyContent: 'center' },
  eye: { position: 'absolute', left: 11, top: 0, bottom: 0, justifyContent: 'center' },

  stepTitle: { fontSize: 17, fontWeight: '700', color: surface.ink, textAlign: 'center', marginBottom: 10 },
  lede: { fontSize: 13, fontWeight: '300', lineHeight: 20, color: surface.muted, textAlign: 'center', marginBottom: 8 },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 12 },
  dot: { height: 4, width: 20, borderRadius: 999, backgroundColor: 'rgba(130,112,162,0.2)' },
  dotOn: { width: 32, backgroundColor: PLUM },
  dotDone: { backgroundColor: 'rgba(123,92,188,0.45)' },

  /* ⚠ שדה שקוף מעל התיבות · מקבל את ההקלדה, והתיבות הן הציור */
  otpRow: { flexDirection: 'row-reverse', gap: 7, justifyContent: 'center', marginBottom: 10, position: 'relative' },
  otpInput: { ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }), opacity: 0, zIndex: 2, color: 'transparent' },
  otpBox: {
    width: 42,
    height: 52,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.22)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxOn: { borderColor: PLUM },
  otpBoxFull: { borderColor: PLUM },
  otpDigit: { fontSize: 23, fontWeight: '700', color: DEEP },

  waRow: { alignItems: 'center', marginBottom: 4 },
  waPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(37,211,102,0.12)',
  },
  waText: { fontSize: 11.5, fontWeight: '600', color: '#127A3E' },

  faceWrap: { alignItems: 'center', gap: 10, paddingVertical: 6 },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    backgroundColor: 'rgba(212,175,55,0.09)',
  boxShadow: iconOrbShadow('212,175,55'),
  },
  askTitle: { fontSize: 16, fontWeight: '700', color: surface.ink, textAlign: 'center' },
  /* הצעת זיהוי הפנים · הכפתור על כל הרוחב, והסירוב בלי מסגרת */
  askCta: { alignSelf: 'stretch', paddingHorizontal: 24 },
  askGhost: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  genders: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  gender: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  genderOn: { borderColor: PLUM, backgroundColor: '#F7F3FD' },
  genderText: { fontSize: 11.5, fontWeight: '600', color: '#8A8194' },
  genderTextOn: { color: DEEP },

  terms: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: 6, marginBottom: 6 },
  termsLocked: { opacity: 0.72 },
  box: {
    width: 21,
    height: 21,
    borderRadius: 7,
    marginTop: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: PLUM, borderColor: PLUM },
  termsText: { fontSize: 12, fontWeight: '300', lineHeight: 18, color: surface.muted },
  termsLink: { color: PLUM, fontWeight: '600', textDecorationLine: 'underline' },
  needRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  needText: { fontSize: 11, fontWeight: '600', color: '#9A7A3A' },
  grow: { flex: 1 },

  cta: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: LAV,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  ctaOff: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(130,112,162,0.16)' },
  orText: { fontSize: 11.5, color: surface.faint },
  /* ⚠ מושבת כשאין מזהי גוגל · ראו `lib/googleAuth.ts` */
  ghostOff: { opacity: 0.45 },
  ghost: {
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ghostText: { fontSize: 14.5, fontWeight: '600', color: '#6E6480' },
  /* ⚠ כפתור גוגל · המידות של גוגל · ראו את ההערה ליד הכפתור */
  gbtn: {
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#747775',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  gbtnText: { fontSize: 14.5, fontWeight: '600', color: '#1F1F1F' },

  links: { flexDirection: 'row', gap: 18, justifyContent: 'center', marginTop: 12 },
  /* ⚠ בבולט · בקשה של שקד */
  linkStrong: { fontSize: 12.5, fontWeight: '700', color: '#5E5470', paddingVertical: 4 },
  link: { fontSize: 12.5, color: '#8A8194', textAlign: 'center', paddingVertical: 8 },
  err: { fontSize: 13, color: '#B95349', textAlign: 'center', marginTop: 10 },
  faceHelp: {
    fontSize: 13,
    color: '#B95349',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  faceLink: { fontSize: 14, fontWeight: '600', color: '#7C5CC4' },
});

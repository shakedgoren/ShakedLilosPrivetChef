import React, { useCallback, useEffect, useRef, useState } from 'react';
import { INPUT_START } from '../theme/rtl';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../ui/text';
import { radius, space, surface } from '../theme/tokens';
import { useNav } from '../navigation/store';
import { apiEnabled } from '../api/config';
import {
  forgotPassword,
  googleSignIn,
  login,
  me,
  register,
  registerPhone,
  registerVerify,
  updateMe,
} from '../api/auth';
import { authError, COPY } from '../api/copy';
import { ApiError, type Session } from '../api/types';
import { BlobField } from '../components/BlobField';
import { EyeToggle } from '../components/EyeToggle';
import { ForgotSheet, TermsSheet } from '../components/LoginSheets';
import { Mail, WhatsApp } from '../components/LoginIcons';
import { S } from '../components/Sym';
import { User } from '../icons';
import { armFace, disarmFace, faceArmed, faceAvailable, unlockWithFace } from '../lib/faceUnlock';
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
  PASS_MIN,
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
  Icon?: typeof User;
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

export function LoginScreen({ mode }: { mode: 'in' | 'up' }) {
  const { go, signIn, closeLogin, loginOverlay } = useNav();
  /* ⚠ חייב להיקרא בראש הרכיב · זה הוק · ראו `lib/googleAuth.ts` */
  const google = useGoogleIdToken();
  const [step, setStep] = useState<Step>(mode === 'up' ? 'up1' : 'in');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [code, setCode] = useState('');
  const [gender, setGender] = useState<Gender>('');

  const [terms, setTerms] = useState(false);
  /* ⚠ אי אפשר לאשר לפני שפותחים · בקשה מפורשת של שקד */
  const [read, setRead] = useState(false);
  const [sheet, setSheet] = useState<null | 'doc' | 'forgot'>(null);
  const [resetMail, setResetMail] = useState('');
  const [resetSent, setResetSent] = useState(false);

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

  const onArm = (yes: boolean) =>
    run(async () => {
      const session = pending.current;
      pending.current = null;
      if (yes && session) await armFace(session.token);
      if (session) signIn(session);
      else setStep('in');
    });

  const onSendCode = () =>
    run(async () => {
      if (apiEnabled) await registerPhone(phone.trim());
      setCode('');
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
      const session = await register(phone.trim(), pass, name.trim());
      signIn(session);
      /* המייל והמגדר אינם בנתיב ההרשמה · נשלחים מיד אחריו */
      try {
        await updateMe({ email: mail.trim() || null, gender });
      } catch {
        /* החשבון כבר קיים · אפשר להשלים באזור האישי */
      }
    });

  const onForgot = () =>
    run(async () => {
      if (apiEnabled && okMail(resetMail)) await forgotPassword(resetMail.trim());
      setResetSent(true);
    });

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
            <WhatsApp size={13} color="#127A3E" strokeWidth={1.8} />
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
            <WhatsApp size={13} color="#127A3E" strokeWidth={1.8} />
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
        <Field label="שם מלא" value={name} onChange={setName} placeholder="שם ושם משפחה" Icon={User} showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        <Field label="אימייל" value={mail} onChange={setMail} placeholder="name@mail.com" Icon={Mail} keyboard="email-address" showPass={showPass} onEye={() => setShowPass((v) => !v)} />
        <Field label="סיסמה" value={pass} onChange={setPass} placeholder={`לפחות ${PASS_MIN} תווים`} sym="lock" secure eye showPass={showPass} onEye={() => setShowPass((v) => !v)} />
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
      ? okPhone(phone) && pass.length >= PASS_MIN
      : step === 'up1'
        ? okPhone(phone)
        : step === 'up2'
          ? code.length === OTP_LEN
          : step === 'up3'
            ? name.trim() !== '' &&
              okMail(mail) &&
              pass.length >= PASS_MIN &&
              pass2 === pass &&
              terms
            : true;

  const ctaLabel =
    step === 'up1' ? T.sendCode : step === 'up2' ? T.otpCta : step === 'up3' ? CTA_UP : CTA_IN;
  const onCta =
    step === 'up1' ? onSendCode : step === 'up2' ? onVerify : step === 'up3' ? onRegister : onLogin;
  const showCta = step !== 'ask' && step !== 'face';
  /* ⚠ בשלב הקוד אין שורת קישורים · בקשה של שקד */
  const showLinks = step !== 'up2' && step !== 'face';

  return (
    <View style={s.page}>
      <BlobField />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.brandBlock}>
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
                <Pressable
                  onPress={onGoogle}
                  disabled={busy || (apiEnabled && !google.ready)}
                  style={[s.ghost, apiEnabled && !google.ready && s.ghostOff]}
                >
                  <Text style={s.ghostText}>{GOOGLE_LABEL}</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {err ? <Text style={s.err}>{err}</Text> : null}

          {showLinks ? (
            <View style={s.links}>
              {!isUp ? (
                <Pressable onPress={() => { setResetSent(false); setSheet('forgot'); }}>
                  {/* ⚠ בבולט · בקשה של שקד */}
                  <Text style={s.linkStrong}>{FORGOT_LABEL}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setStep(isUp ? 'in' : 'up1')}>
                <Text style={s.linkStrong}>{isUp ? TAB_IN : TAB_UP}</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable onPress={() => (loginOverlay ? closeLogin() : go('guest'))}>
            <Text style={s.link}>{GUEST_LABEL}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {sheet === 'doc' ? (
        <TermsSheet onClose={() => setSheet(null)} onAgree={() => { setTerms(true); setRead(true); setSheet(null); }} />
      ) : null}
      {sheet === 'forgot' ? (
        <ForgotSheet
          email={resetMail}
          onEmail={setResetMail}
          onSend={onForgot}
          onClose={() => setSheet(null)}
          sent={resetSent}
          busy={busy || !okMail(resetMail)}
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

  links: { flexDirection: 'row', gap: 18, justifyContent: 'center', marginTop: 12 },
  /* ⚠ בבולט · בקשה של שקד */
  linkStrong: { fontSize: 12.5, fontWeight: '700', color: '#5E5470', paddingVertical: 4 },
  link: { fontSize: 12.5, color: '#8A8194', textAlign: 'center', paddingVertical: 8 },
  err: { fontSize: 13, color: '#B95349', textAlign: 'center', marginTop: 10 },
});

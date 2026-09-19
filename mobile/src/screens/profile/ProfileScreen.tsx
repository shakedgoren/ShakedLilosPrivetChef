import React, { useEffect, useMemo, useState } from 'react';
import { INPUT_START } from '../../theme/rtl';
import { SCROLL_PAD_NAV } from '../../components/BottomNav';
import { Modal, Pressable, ScrollView, StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput } from '../../ui/text';
import { apiEnabled, API_URL } from '../../api/config';
import { changePassword, updateMe, uploadAvatar } from '../../api/auth';
import { pickAvatar } from '../../lib/pickImage';
import { COPY } from '../../api/copy';
import { ApiError, GENDERS, type Gender, type PublicUser } from '../../api/types';
import { CITIES } from '../../data/shared';
import { PLACES } from '../../data/profile';

/** כמה הצעות כתובת מוצגות · כמו בקנבס */
const MAX_SUGGESTIONS = 4;
import { useNav } from '../../navigation/store';
import { a, radius, space, surface } from '../../theme/tokens';
import { S } from '../../components/Sym';
import { iconOrbShadow } from '../../theme/glass';

const IDLE_BD = 'rgba(130,112,162,0.18)';
const BAD_BD = 'rgba(185,83,73,0.5)';
const PASS_MIN = 8;

const MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

const trim = (v: string) => v.trim();
const okPhone = (v: string) => /^0(5\d|[2-4,8-9])-?\d{7}$/.test(trim(v).replace(/\s/g, ''));
const okMail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trim(v));

function joinAddr(address: string, city: string): string {
  const a = address.trim();
  const c = city.trim();
  if (a && c && !a.includes(c)) return `${a}, ${c}`;
  return a || c;
}

function splitAddr(raw: string): { address: string; city: string } {
  const parts = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { address: parts.slice(0, -1).join(', '), city: parts[parts.length - 1] };
  }
  return { address: raw.trim(), city: '' };
}

function cityOf(addr: string): string {
  return splitAddr(addr).city;
}

/**
 * ⚠ היה ״לקוחה מאז״ קבוע · זו בדיוק הסיבה ששקד ביקשה שדה מגדר.
 * בלי בחירה נשארת לשון נקבה, כפי שהיה.
 */
/**
 * בורר המגדר · אייקון גדול ומתחתיו הכיתוב.
 *
 * ⚠ **הסדר והכיתוב לפי בקשת שקד** (16 בספטמבר 2026): ״האייקון בגדול
 * ומתחתיו יהיה כתוב גבר, בשני אישה, ובשלישי אחר״. לכן הסדר כאן קבוע
 * ואינו נגזר מ-`GENDERS` שב-`api/types` (שם הסדר הוא female קודם).
 *
 * ⚠ **כיתוב נפרד מ-`GENDER_LABEL`** · זה האחרון משמש את שורת
 * ״לקוחה מאז…״ ואסור לו להשתנות ל״אישה מאז…״.
 */
const GENDER_PICK = [
  { key: 'male', label: 'גבר', sym: 'male' },
  { key: 'female', label: 'אישה', sym: 'female' },
  { key: 'other', label: 'אחר', sym: 'other' },
] as const satisfies readonly { key: Exclude<Gender, ''>; label: string; sym: 'male' | 'female' | 'other' }[];

/** גודל האייקון בבורר · ״בגדול״ */
const GENDER_ICON = 30;

/** הסגול של הבחירה · כמו בשאר המסך */
const PLUM = '#7B5CBC';

const GENDER_LABEL: Record<Gender, string> = {
  female: 'לקוחה',
  male: 'לקוח',
  other: 'לקוח/ה',
  '': 'לקוחה',
};

function sinceLabel(iso: string | undefined, gender: Gender): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${GENDER_LABEL[gender]} מאז ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fromUser(user: PublicUser | null) {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    mail: user?.email ?? '',
    addr: user ? joinAddr(user.address, user.city) : '',
    gender: (user?.gender ?? '') as Gender,
  };
}

type Form = ReturnType<typeof fromUser>;

/** אזור אישי · מקביל ל-Profile.dc.html, נשמר ב-PATCH /users/me */
/** כפתור השמירה · מיושר לכפתור ההתנתקות שבצד השני של המסך */
const SAVE_SIZE = 38;
const SAVE_TOP = 22;

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, setUser } = useNav();
  const seed = useMemo(() => fromUser(user), [user]);
  const [form, setForm] = useState<Form>(seed);
  const [base, setBase] = useState<Form>(seed);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [passOpen, setPassOpen] = useState(false);
  const [pass, setPass] = useState({ cur: '', next: '', again: '' });
  const [passErr, setPassErr] = useState('');
  /* העלאת תמונת פרופיל · הודעה משלה, כדי לא לדרוס שגיאת שמירה */
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState('');

  /**
   * ⚠ **זה מה שהיה שבור** · אייקון המצלמה היה ציור בלבד. עכשיו הוא
   * כפתור שפותח בורר קבצים ושולח לשרת, שתמך בזה כל הזמן.
   */
  const onPickPhoto = async () => {
    if (photoBusy) return;
    setPhotoErr('');
    const picked = await pickAvatar();
    if (!picked.ok) {
      if (picked.reason === 'denied') setPhotoErr('אין הרשאה לגלריה');
      else if (picked.reason === 'failed') setPhotoErr('לא הצלחנו לקרוא את התמונה');
      return;
    }
    if (!apiEnabled) {
      setPhotoErr('אין חיבור לשרת · התמונה לא נשמרה');
      return;
    }
    setPhotoBusy(true);
    try {
      const { user: next } = await uploadAvatar(picked.dataUrl);
      setUser(next);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setPhotoErr(
        code === 'image_too_large'
          ? 'התמונה גדולה מדי · עד 2MB'
          : code === 'invalid_image'
            ? 'סוג קובץ לא נתמך'
            : COPY.saveFail,
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  useEffect(() => {
    const next = fromUser(user);
    setForm(next);
    setBase(next);
  }, [user]);

  const set = (id: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [id]: v }));
    setSaved(false);
    setErr('');
  };

  /**
   * ⚠ **הכתובת אינה חובה · 19 בספטמבר 2026** · בקשה של שקד:
   * ״שלא יחייב למלא כתובת מגורים — זה לא חובה״. היא חסמה את
   * השמירה, ולכן מי שרצתה רק לתקן שם או מייל לא יכלה.
   * ⚠ באיסוף עצמי אין בה צורך בכלל, ובמשלוח היא נשאלת בהזמנה.
   */
  const errors = {
    name: trim(form.name) === '',
    phone: !okPhone(form.phone),
    mail: trim(form.mail) !== '' && !okMail(form.mail),
  };
  const dirty = (Object.keys(base) as (keyof Form)[]).some((k) => form[k] !== base[k]);
  const ok = !Object.values(errors).some(Boolean);
  const canSave = ok && dirty && !busy;

  const city = cityOf(form.addr);
  const noShip = !!(city && !(CITIES as readonly string[]).includes(city));

  /* השלמת כתובות · מחפשת גם ברחוב וגם בעיר ומרכיבה ״רחוב מספר, עיר״.
     נסגרת ברגע שהוקלדה עיר מלאה, בדיוק כמו בקנבס. */
  const suggestions = useMemo(() => {
    const raw = trim(form.addr);
    if (raw.length < 2 || city) return [];
    const num = raw.match(/\d+/)?.[0] ?? '';
    const words = raw.replace(/[,\d]/g, ' ').split(/\s+/).filter(Boolean);
    return PLACES.filter((pl) =>
      words.some((w) => pl.street.indexOf(w) === 0 || pl.city.indexOf(w) === 0),
    )
      .slice(0, MAX_SUGGESTIONS)
      .map((pl) => `${pl.street}${num ? ' ' + num : ''}, ${pl.city}`);
  }, [form.addr, city]);

  const save = async () => {
    if (!canSave) return;
    const { address, city: parsedCity } = splitAddr(form.addr);
    if (!apiEnabled) {
      setBase(form);
      setSaved(true);
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const { user: next } = await updateMe({
        name: trim(form.name),
        phone: trim(form.phone).replace(/[-\s]/g, ''),
        address,
        city: parsedCity,
        email: trim(form.mail) || null,
        gender: form.gender,
      });
      setUser(next);
      const synced = fromUser(next);
      setForm(synced);
      setBase(synced);
      setSaved(true);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setErr(
        code === 'invalid_phone'
          ? 'מספר טלפון לא תקין'
          : code === 'invalid_who'
            ? 'כתובת אימייל לא תקינה'
            : code === 'email_taken' || code === 'phone_taken'
              ? COPY.taken
              : COPY.saveFail,
      );
    } finally {
      setBusy(false);
    }
  };

  const pe = {
    cur: trim(pass.cur) === '',
    next: trim(pass.next) !== '' && trim(pass.next).length < PASS_MIN,
    again: trim(pass.again) !== '' && pass.again !== pass.next,
  };
  const passReady =
    trim(pass.cur) !== '' &&
    trim(pass.next).length >= PASS_MIN &&
    pass.again === pass.next &&
    !pe.next &&
    !pe.again;

  const savePass = async () => {
    if (!passReady) return;
    setPassErr('');
    if (!apiEnabled) {
      setPassOpen(false);
      setPass({ cur: '', next: '', again: '' });
      setSaved(true);
      return;
    }
    try {
      await changePassword(pass.cur, pass.next);
      setPassOpen(false);
      setPass({ cur: '', next: '', again: '' });
      setSaved(true);
    } catch (e) {
      setPassErr(e instanceof ApiError && e.code === 'invalid_credentials' ? COPY.passWrong : COPY.saveFail);
    }
  };

  const since = sinceLabel(user?.createdAt, form.gender);
  const displayName = trim(form.name) || 'ללא שם';
  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `${API_URL}${user.avatarUrl}`
    : '';

  return (
    <View style={s.page}>
      {/* ⚠ **ממורכזת · 16 בספטמבר 2026** · בקשה של שקד. `head` היה
          `space-between` עם ילד יחיד, ולכן הכותרת נצמדה לקצה. */}
      <View style={s.head}>
        <Text style={s.title}>אזור אישי</Text>
      </View>

      {/* ⚠ **כפתור השמירה עלה לכאן · 16 בספטמבר 2026** · בקשה של
          שקד: ״הכפתור שמור לא צריך להיות שם תוריד אותו במקום זה
          תוסיף כפתור עם V מימין לאיזור אישי באותה השורה של הכפתור
          התנתקות״.
          ⚠ **בלי `insets.top` · תוקן ב-17 בספטמבר 2026** · שקד
          דיווחה שהכפתור אינו באותו גובה של ההתנתקות. `LogoutButton`
          יושב בשכבה מוחלטת שפרושה על **כל המסך**, ולכן הוא מוסיף
          את ההיסט בעצמו. הכפתור כאן יושב בתוך `s.page`, שכבר מתחיל
          **אחרי** האזור הבטוח — וההיסט נספר פעמיים.
          ⚠ הכפתור מוצג תמיד · אפור כשאין מה לשמור, גם זו בקשתה. */}
      <Pressable
        onPress={() => void save()}
        disabled={!canSave}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="שמירת הפרטים"
        style={[s.saveFab, { top: SAVE_TOP }, canSave ? s.saveOn : s.saveOff]}
      >
        <S k="check" size={18} color={canSave ? '#43307A' : '#A79FB2'} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[s.body, s.scrollPadNav]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          {/**
            * ⚠ **תג המצלמה יצא מתוך העיגול · 19 בספטמבר 2026** ·
            * בקשה של שקד: ״יש אייקון של מצלמה, הוא צריך להיות מעל
            * העיגול של התמונה ואטום״.
            *
            * שתי הסיבות שהוא נראה שקוף ומתחת:
            * · `iconOrbShadow` של **העיגול** כולל `inset` לבן חזק,
            *   ו-iOS מצייר צל פנימי **מעל** ילדי התצוגה. הקשת
            *   הלבנה של העיגול עברה ממש על גבי התג.
            * · ל**תג עצמו** היה אותו צל פנימי, שהלבין את המילוי
            *   מבפנים והפך אותו לשקוף למראה.
            *
            * לכן הוא יושב עכשיו **אחיו** של העיגול ולא ילד שלו —
            * כך שום דבר לא נמרח מעליו — עם מילוי אטום וצל חיצוני
            * בלבד.
            */}
          <View style={s.avatarWrap}>
            <Pressable
              onPress={onPickPhoto}
              disabled={photoBusy}
              style={[s.avatar, photoBusy && s.avatarBusy]}
            >
              {avatarSrc ? (
                <Image source={{ uri: avatarSrc }} style={s.avatarImg} />
              ) : (
                <Text style={s.avatarGlyph}>☺</Text>
              )}
            </Pressable>
            {/* ⚠ `pointerEvents` · הלחיצה ממשיכה להגיע לעיגול שמתחת */}
            <View style={s.cam} pointerEvents="none">
              {/* ⚠ היה אמוג׳י · עכשיו camera.fill כפי שביקשה שקד */}
              <S k="camera" size={15} color="#FFFFFF" />
            </View>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          {since ? <Text style={s.since}>{since}</Text> : null}
          {photoErr ? <Text style={s.photoErr}>{photoErr}</Text> : null}
        </View>

        <View style={s.card}>
          <Text style={s.cardLabel}>פרטים אישיים</Text>
          <Field
            label="שם מלא"
            ph="שם ושם משפחה"
            value={form.name}
            onChange={(v) => set('name', v)}
            bad={errors.name}
            hint="צריך שם כדי שאדע למי לקרוא"
          />
          {/**
            * ⚠ **הטלפון נעול · בקשה של שקד (19 בספטמבר 2026)** ·
            * ״אמרנו שטלפון אי אפשר לעדכן, זה צריך להיות נעול״.
            *
            * ⚠ **גם בשרת** · `PATCH /users/me` דוחה שינוי מספר.
            * נעילה במסך בלבד היא קישוט — המספר הוא המזהה שאיתו
            * נכנסים לחשבון, והוא מאומת בקוד חד-פעמי בהרשמה.
            *
            * ⚠ הכיתוב ״המספר משמש לכניסה לחשבון״ נכתב על ידי
            * Claude, שקד לא כתבה אותו.
            */}
          <Field
            label="טלפון"
            ph="050-0000000"
            value={form.phone}
            onChange={(v) => set('phone', v)}
            bad={errors.phone}
            hint="מספר טלפון לא תקין"
            keyboardType="phone-pad"
            /**
             * ⚠ **נעול רק כשיש מספר** · מי שנרשם בגוגל נכנס בלי
             * טלפון. נעילה גורפת הייתה נועלת אותו בלי מספר לתמיד,
             * ועם מסגרת אדומה שאי אפשר לתקן. השרת מתנהג בדיוק כך
             * — ראו `auth/phoneLock.ts`.
             */
            locked={Boolean(user?.phone)}
            note={user?.phone ? 'המספר משמש לכניסה לחשבון ולכן אי אפשר לשנות אותו' : undefined}
          />
          <Field
            label="אימייל"
            ph="name@mail.com"
            value={form.mail}
            onChange={(v) => set('mail', v)}
            bad={errors.mail}
            hint="כתובת אימייל לא תקינה"
            keyboardType="email-address"
          />

          {/* ⚠ **שדה חדש** · שקד ביקשה מגדר כדי לדעת אם מדובר בלקוח
              או בלקוחה. הוא מזין את שורת ״לקוחה מאז״. */}
          <View style={s.genderBlock}>
            <Text style={s.genderLabel}>מגדר</Text>
            {/* ⚠ **עם האייקונים ששקד בחרה** · שפם, פה ומוח — אותם
                סמלים בדיוק שכבר במסך ההרשמה. כאן היה כיתוב בלבד,
                והיא דיווחה על זה ב-16 בספטמבר 2026. */}
            <View style={s.genders}>
              {GENDER_PICK.map((g) => (
                <Pressable
                  key={g.key}
                  onPress={() => set('gender', form.gender === g.key ? '' : g.key)}
                  style={[s.gender, form.gender === g.key && s.genderOn]}
                >
                  <S k={g.sym} size={GENDER_ICON} color={form.gender === g.key ? PLUM : undefined} />
                  <Text style={[s.genderText, form.gender === g.key && s.genderTextOn]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.addrHead}>
            <Text style={s.cardLabel}>כתובת מגורים</Text>
            <Text style={s.addrNote}>לשימוש במשלוחים · לא חובה</Text>
          </View>
          <Field
            label=""
            ph="רחוב, מספר ועיר"
            value={form.addr}
            onChange={(v) => set('addr', v)}
          />
          {suggestions.length > 0 ? (
            <View style={s.sug}>
              {suggestions.map((g) => (
                <Pressable key={g} onPress={() => set('addr', g)} style={s.sugRow}>
                  <Text style={s.sugText}>{g}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {noShip ? <Text style={s.noShip}>אין משלוחים לאיזור הזה</Text> : null}
        </View>

        <View style={s.card}>
          <Text style={s.cardLabel}>אבטחה</Text>
          <Pressable onPress={() => setPassOpen(true)} style={s.passRow}>
            <View style={s.passIcon}>
              <Text style={s.passLock}>⌥</Text>
            </View>
            <View style={s.grow}>
              <Text style={s.passTitle}>שינוי סיסמה</Text>
              <Text style={s.passSub}>מומלץ להחליף מדי כמה חודשים</Text>
            </View>
            <S k="chevronLeft" size={13} color="#C1BBCB" />
          </Pressable>
        </View>

        {saved ? (
          <View style={s.savedPill}>
            <Text style={s.savedText}>הפרטים נשמרו</Text>
          </View>
        ) : null}
        {err ? <Text style={s.err}>{err}</Text> : null}

      </ScrollView>

      <Modal visible={passOpen} transparent animationType="fade" onRequestClose={() => setPassOpen(false)}>
        <Pressable style={s.scrim} onPress={() => setPassOpen(false)}>
          <Pressable style={s.passSheet} onPress={() => {}}>
            <View style={s.passHead}>
              <View style={s.grow}>
                <Text style={s.passSheetTitle}>שינוי סיסמה</Text>
                <Text style={s.passRule}>לפחות {PASS_MIN} תווים</Text>
              </View>
              <Pressable onPress={() => setPassOpen(false)} style={s.close}>
                <S k="close" size={13} color="#6E6478" />
              </Pressable>
            </View>
            <Field
              label="הסיסמה הנוכחית"
              ph="הסיסמה שאיתה נכנסת"
              value={pass.cur}
              onChange={(v) => setPass((p) => ({ ...p, cur: v }))}
              secure
            />
            <Field
              label="סיסמה חדשה"
              ph={`לפחות ${PASS_MIN} תווים`}
              value={pass.next}
              onChange={(v) => setPass((p) => ({ ...p, next: v }))}
              bad={pe.next}
              hint="הסיסמה קצרה מדי"
              secure
            />
            <Field
              label="אימות הסיסמה החדשה"
              ph="שוב, בדיוק אותו דבר"
              value={pass.again}
              onChange={(v) => setPass((p) => ({ ...p, again: v }))}
              bad={pe.again}
              hint="שתי הסיסמאות לא זהות"
              secure
            />
            {passErr ? <Text style={s.err}>{passErr}</Text> : null}
            <Pressable
              onPress={() => void savePass()}
              disabled={!passReady}
              style={[s.passCta, { opacity: passReady ? 1 : 0.45 }]}
            >
              <Text style={s.emptyCtaText}>עדכון הסיסמה</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

function Field({
  label,
  ph,
  value,
  onChange,
  bad,
  hint,
  keyboardType,
  secure,
  locked,
  note,
}: {
  label: string;
  ph: string;
  value: string;
  onChange: (v: string) => void;
  bad?: boolean;
  hint?: string;
  keyboardType?: 'phone-pad' | 'email-address';
  secure?: boolean;
  /** ⚠ נעול · ראו את שדה הטלפון */
  locked?: boolean;
  /** שורת הסבר קטנה מתחת לשדה */
  note?: string;
}) {
  return (
    <View style={s.fieldWrap}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={ph}
        placeholderTextColor="#B3ABBD"
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize="none"
        editable={!locked}
        /* ⚠ שדה נעול לעולם לא נצבע באדום · אין בו מה לתקן */
        style={[s.input, { borderColor: !locked && bad ? BAD_BD : IDLE_BD }, locked && s.inputLocked]}
      />
      {!locked && bad && hint ? <Text style={s.hint}>{hint}</Text> : null}
      {note ? <Text style={s.note}>{note}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ שני המסכים האלה מוצגים רק למשתמשת מחוברת, ולכן הריפוד
     לנאב-בר קבוע ולא מותנה. בלעדיו התוכן האחרון נחתך מתחתיו. */
  scrollPadNav: { paddingBottom: SCROLL_PAD_NAV },
  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.xxl },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
  title: { fontSize: 21, fontWeight: '600', color: surface.ink },
  authBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF7FD',
    alignItems: 'center',
    justifyContent: 'center',
  boxShadow: iconOrbShadow('130,112,162'),
  },
  authGlyph: { fontSize: 18, color: '#8A8194' },

  body: { gap: 12, paddingBottom: 120 },
  hero: { alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(123,92,188,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: iconOrbShadow('123,92,188'),
  },
  avatarBusy: { opacity: 0.6 },
  avatarImg: { position: 'absolute', width: 92, height: 92, borderRadius: 46 },
  photoErr: { fontSize: 11.5, color: '#B95349', marginTop: 4, textAlign: 'center' },
  /* בורר המגדר · אותה שפה של גלולות הערים */
  genderBlock: { gap: 6 },
  genderLabel: { fontSize: 11.5, fontWeight: '500', color: '#8A8194', paddingHorizontal: 4 },
  genders: { flexDirection: 'row', gap: 8 },
  /**
   * ⚠ **טור ולא שורה** · האייקון גדול ומעל, הכיתוב מתחתיו. בקשה
   * מפורשת של שקד. הגלולה הפכה לכרטיס מרובע יותר כדי שיהיה מקום.
   */
  gender: {
    flex: 1,
    height: 74,
    borderRadius: 18,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  genderOn: { backgroundColor: a('123,92,188', 0.22) },
  genderText: { fontSize: 13, color: surface.inkSoft },
  genderTextOn: { color: '#43307A', fontWeight: '600' },
  avatarGlyph: { fontSize: 36, color: '#43307A' },
  /* ⚠ המכל שמחזיק את העיגול ואת התג · ראו ההערה ליד ההרכבה */
  avatarWrap: { width: 92, height: 92 },
  /**
   * ⚠ **אטום ומעל · בקשה של שקד (19 בספטמבר 2026)** · מילוי מלא
   * בלי צל פנימי, וסמל לבן שנקרא גם על גבי תמונה כהה. המיקום
   * הוזז פנימה כדי שהתג יישב **על** העיגול ולא ייחתך על שפתו.
   */
  cam: {
    position: 'absolute',
    /* ⚠ 10 · נמדד · בזה התג יושב **כולו** בתוך העיגול ולא נחתך על שפתו */
    bottom: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#7B5CBC',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px -4px rgba(60,44,92,0.55)',
  } as never,
  camGlyph: { fontSize: 11 },
  displayName: { fontSize: 19, fontWeight: '600', color: surface.ink },
  since: { fontSize: 12.5, fontWeight: '300', color: surface.faint },

  card: {
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    gap: 12,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, color: '#A79FB2' },
  addrHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  addrNote: { fontSize: 11.5, color: surface.faint },
  noShip: { fontSize: 11.5, fontWeight: '600', color: '#7B5CBC' },
  sug: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
  },
  sugRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130,112,162,0.1)',
  },
  sugText: { fontSize: 13, color: surface.ink },

  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 11.5, fontWeight: '500', color: surface.faint },
  input: {
    height: 48,
    borderRadius: 15,
    paddingHorizontal: 13,
    fontSize: 13.5,
    color: surface.ink,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    textAlign: INPUT_START,
  },
  /* ⚠ שדה נעול · אפור ורך, כדי שיהיה ברור שאין מה להקליד בו */
  inputLocked: { backgroundColor: 'rgba(130,112,162,0.07)', color: '#8A8194' },
  note: { fontSize: 11.5, fontWeight: '300', color: '#8A8194', marginTop: 4, paddingHorizontal: 4 },
  hint: { fontSize: 11.5, color: '#B95349' },

  passRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  passIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: a('123,92,188', 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  passLock: { fontSize: 16, color: '#43307A' },
  passTitle: { fontSize: 14, fontWeight: '600', color: surface.ink },
  passSub: { fontSize: 11.5, fontWeight: '300', color: surface.faint, marginTop: 1 },
  chev: { fontSize: 18, color: '#B3ABBD' },
  grow: { flex: 1, minWidth: 0 },

  savedPill: {
    alignSelf: 'center',
    marginTop: 6,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(78,138,100,0.12)',
  },
  savedText: { fontSize: 12.5, fontWeight: '600', color: '#4E8A64' },
  err: { fontSize: 12.5, color: '#B95349', textAlign: 'center' },

  /* ⚠ מיושר לכפתור ההתנתקות שבצד השני · אותן מידות בדיוק */
  saveFab: {
    position: 'absolute',
    right: 18,
    width: SAVE_SIZE,
    height: SAVE_SIZE,
    borderRadius: SAVE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  saveOn: { backgroundColor: '#B9A4E4' },
  saveOff: { backgroundColor: 'rgba(130,112,162,0.11)' },

  scrim: {
    flex: 1,
    backgroundColor: 'rgba(42,36,48,0.34)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  passSheet: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#FEFCFB',
    gap: 13,
  },
  passHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  passSheetTitle: { fontWeight: '600', fontSize: 17, color: surface.ink, textAlign: 'center' },
  passRule: { fontSize: 12, fontWeight: '300', color: surface.muted, marginTop: 2, textAlign: 'center' },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  boxShadow: iconOrbShadow('130,112,162'),
  },
  closeX: { fontSize: 13, color: '#6E6478' },
  passCta: {
    alignSelf: 'center',
    height: 48,
    marginTop: 4,
    paddingHorizontal: 30,
    borderRadius: radius.pill,
    backgroundColor: '#B9A4E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaText: { fontWeight: '600', fontSize: 15, color: '#43307A' },
});

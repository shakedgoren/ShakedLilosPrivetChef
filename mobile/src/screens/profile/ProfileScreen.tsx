import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { apiEnabled, API_URL } from '../../api/config';
import { changePassword, updateMe } from '../../api/auth';
import { COPY } from '../../api/copy';
import { ApiError, type PublicUser } from '../../api/types';
import { LogoutConfirm } from '../../components/LogoutConfirm';
import { CITIES } from '../../data/shared';
import { PLACES } from '../../data/profile';

/** כמה הצעות כתובת מוצגות · כמו בקנבס */
const MAX_SUGGESTIONS = 4;
import { useNav } from '../../navigation/store';
import { a, radius, space, surface } from '../../theme/tokens';

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

function sinceLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `לקוחה מאז ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fromUser(user: PublicUser | null) {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    mail: user?.email ?? '',
    addr: user ? joinAddr(user.address, user.city) : '',
  };
}

type Form = ReturnType<typeof fromUser>;

/** אזור אישי · מקביל ל-Profile.dc.html, נשמר ב-PATCH /users/me */
export function ProfileScreen() {
  const { user, signOut, setUser } = useNav();
  const seed = useMemo(() => fromUser(user), [user]);
  const [form, setForm] = useState<Form>(seed);
  const [base, setBase] = useState<Form>(seed);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [outOpen, setOutOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [pass, setPass] = useState({ cur: '', next: '', again: '' });
  const [passErr, setPassErr] = useState('');

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

  const errors = {
    name: trim(form.name) === '',
    phone: !okPhone(form.phone),
    mail: trim(form.mail) !== '' && !okMail(form.mail),
    addr: trim(form.addr) === '',
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

  const since = sinceLabel(user?.createdAt);
  const displayName = trim(form.name) || 'ללא שם';
  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `${API_URL}${user.avatarUrl}`
    : '';

  return (
    <View style={s.page}>
      <View style={s.head}>
        <Text style={s.title}>אזור אישי</Text>
        <Pressable onPress={() => setOutOpen(true)} style={s.authBtn} hitSlop={8}>
          <Text style={s.authGlyph}>⎋</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.avatar}>
            {avatarSrc ? (
              <Image source={{ uri: avatarSrc }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarGlyph}>☺</Text>
            )}
            <View style={s.cam}>
              <Text style={s.camGlyph}>📷</Text>
            </View>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          {since ? <Text style={s.since}>{since}</Text> : null}
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
          <Field
            label="טלפון"
            ph="050-0000000"
            value={form.phone}
            onChange={(v) => set('phone', v)}
            bad={errors.phone}
            hint="מספר טלפון לא תקין"
            keyboardType="phone-pad"
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
        </View>

        <View style={s.card}>
          <View style={s.addrHead}>
            <Text style={s.cardLabel}>כתובת מגורים</Text>
            <Text style={s.addrNote}>לשימוש במשלוחים</Text>
          </View>
          <Field
            label=""
            ph="רחוב, מספר ועיר"
            value={form.addr}
            onChange={(v) => set('addr', v)}
            bad={errors.addr}
            hint="יש להזין כתובת מלאה"
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
            <Text style={s.chev}>‹</Text>
          </Pressable>
        </View>

        {saved ? (
          <View style={s.savedPill}>
            <Text style={s.savedText}>הפרטים נשמרו</Text>
          </View>
        ) : null}
        {err ? <Text style={s.err}>{err}</Text> : null}

        <Pressable
          onPress={() => void save()}
          disabled={!canSave}
          style={[s.save, canSave ? s.saveOn : s.saveOff]}
        >
          <Text style={[s.saveText, { color: canSave ? '#43307A' : '#A79FB2' }]}>שמור</Text>
        </Pressable>
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
                <Text style={s.closeX}>✕</Text>
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

      <LogoutConfirm open={outOpen} onCancel={() => setOutOpen(false)} onConfirm={signOut} />
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
}: {
  label: string;
  ph: string;
  value: string;
  onChange: (v: string) => void;
  bad?: boolean;
  hint?: string;
  keyboardType?: 'phone-pad' | 'email-address';
  secure?: boolean;
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
        style={[s.input, { borderColor: bad ? BAD_BD : IDLE_BD }]}
      />
      {bad && hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground, paddingHorizontal: space.lg, paddingTop: space.xxl },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  avatarImg: { position: 'absolute', width: 92, height: 92, borderRadius: 46 },
  avatarGlyph: { fontSize: 36, color: '#43307A' },
  cam: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#B9A4E4',
    borderWidth: 2,
    borderColor: '#FCFBFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    textAlign: 'right',
  },
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

  save: {
    alignSelf: 'center',
    marginTop: 4,
    height: 44,
    paddingHorizontal: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOn: { backgroundColor: '#B9A4E4' },
  saveOff: { backgroundColor: 'rgba(130,112,162,0.11)' },
  saveText: { fontSize: 15, fontWeight: '600' },

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

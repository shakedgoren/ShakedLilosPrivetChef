import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, space, surface, type } from '../theme/tokens';
import { useNav } from '../navigation/store';
import { apiEnabled } from '../api/config';
import { forgotPassword, googleStub, login, register } from '../api/auth';
import { authError, COPY } from '../api/copy';
import { ApiError } from '../api/types';
import { Photo } from '../components/Photo';
import {
  BRAND,
  BRAND_SUB,
  CTA_IN,
  CTA_UP,
  FIELDS_IN,
  FIELDS_UP,
  FORGOT_LABEL,
  GOOGLE_LABEL,
  GUEST_LABEL,
  LEDE_IN,
  LEDE_UP,
  OR_LABEL,
  PASS_MIN,
  TAB_IN,
  TAB_UP,
} from '../data/login';

/** מסך הכניסה וההרשמה · הטאב הפתוח נקבע לפי המסך שממנו הגענו */
export function LoginScreen({ mode }: { mode: 'in' | 'up' }) {
  const { go, signIn } = useNav();
  const [tab, setTab] = useState<'in' | 'up'>(mode);
  /* טופס אחד לשני הטאבים · השדות מגיעים מהקנבס */
  const [form, setForm] = useState<Record<string, string>>({});
  const setField = (id: string, v: string) => setForm((f) => ({ ...f, [id]: v }));
  const fields = tab === 'in' ? FIELDS_IN : FIELDS_UP;
  /* השרת מקבל מזהה אחד · בכניסה זה who, בהרשמה הטלפון */
  const who = tab === 'in' ? form.who ?? '' : form.phone ?? '';
  const pass = form.pass ?? '';
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const isIn = tab === 'in';
  /* כל שדה חייב להתמלא · ובהרשמה גם אימות הסיסמה חייב להתאים */
  const filled = fields.every((f) => (form[f.id] ?? '').trim() !== '');
  const passOk = pass.trim().length >= PASS_MIN;
  const confirmOk = tab === 'in' || (form.pass2 ?? '') === pass;
  const can = filled && passOk && confirmOk && !busy;

  const onSubmit = async () => {
    if (!can) return;
    if (!apiEnabled) {
      signIn();
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const session = isIn ? await login(who.trim(), pass) : await register(who.trim(), pass);
      signIn(session);
    } catch (e) {
      setErr(e instanceof ApiError ? authError(e.code) : COPY.net);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    if (!apiEnabled) {
      signIn();
      return;
    }
    setBusy(true);
    setErr('');
    try {
      signIn(await googleStub());
    } catch (e) {
      setErr(e instanceof ApiError ? authError(e.code) : COPY.google);
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async () => {
    if (apiEnabled && who.trim().length > 2) {
      try {
        await forgotPassword(who.trim());
      } catch {
        /* ההודעה למשתמשת זהה גם אם השרת לא מצא חשבון */
      }
    }
    setSent(true);
  };

  return (
    <View style={s.page}>
      {/* עיגול הזכוכית עם הלוגו · 84px בקנבס, הלוגו 62px בתוכו */}
      <View style={s.logoRing}>
        <Photo name="logo" style={s.logo} resizeMode="contain" />
      </View>

      <View style={s.brandBlock}>
        <Text style={s.brand}>{BRAND}</Text>
        <Text style={s.brandSub}>{BRAND_SUB}</Text>
      </View>

      {/* מתג כניסה / הרשמה · גלולה עם ידית לבנה */}
      <View style={s.tabs}>
        <Pressable onPress={() => setTab('in')} style={[s.tab, isIn && s.tabActive]}>
          <Text style={[s.tabText, isIn && s.tabOn]}>{TAB_IN}</Text>
        </Pressable>
        <Pressable onPress={() => setTab('up')} style={[s.tab, !isIn && s.tabActive]}>
          <Text style={[s.tabText, !isIn && s.tabOn]}>{TAB_UP}</Text>
        </Pressable>
      </View>

      <Text style={s.lede}>{isIn ? LEDE_IN : LEDE_UP}</Text>

      {/* גוגל קודם · ואז המפריד, כמו בקנבס */}
      <Pressable disabled={busy} onPress={onGoogle} style={s.ghost}>
        <Text style={s.ghostText}>{GOOGLE_LABEL}</Text>
      </Pressable>

      <View style={s.orRow}>
        <View style={s.orLine} />
        <Text style={s.orText}>{OR_LABEL}</Text>
        <View style={s.orLine} />
      </View>

      {fields.map((f) => (
        <View key={f.id} style={s.fieldBlock}>
          <Text style={s.fieldLabel}>{f.label}</Text>
          <TextInput
            value={form[f.id] ?? ''}
            onChangeText={(v) => setField(f.id, v)}
            placeholder={f.placeholder}
            placeholderTextColor="#B3ABBD"
            secureTextEntry={f.type === 'password'}
            keyboardType={f.type === 'tel' ? 'phone-pad' : f.type === 'email' ? 'email-address' : 'default'}
            autoCapitalize="none"
            style={s.field}
          />
        </View>
      ))}

      {isIn ? (
        <Pressable onPress={onForgot} style={s.forgotWrap}>
          <Text style={s.link}>{FORGOT_LABEL}</Text>
        </Pressable>
      ) : null}

      <View style={s.grow} />

      <Pressable disabled={!can} onPress={onSubmit} style={[s.cta, { opacity: can ? 1 : 0.45 }]}>
        <Text style={s.ctaText}>{isIn ? CTA_IN : CTA_UP}</Text>
      </Pressable>

      {err ? <Text style={s.err}>{err}</Text> : null}

      <Pressable onPress={() => go('guest')}>
        <Text style={s.link}>{GUEST_LABEL}</Text>
      </Pressable>

      {sent && (
        <View style={s.note}>
          <Text style={s.noteTitle}>שלחנו לך קישור לאיפוס</Text>
          <Text style={s.noteBody}>בדקי את ההודעות · הקישור תקף לשעה.</Text>
          <Pressable onPress={() => setSent(false)} style={s.noteBtn}>
            <Text style={s.noteBtnText}>סגירה</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  brandBlock: { alignItems: 'center', marginBottom: 18 },
  brand: { fontSize: 23, fontWeight: '600', color: surface.ink },
  brandSub: { fontSize: 13, fontWeight: '300', color: surface.faint, marginTop: 2 },

  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#605084',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  lede: {
    fontSize: 13.5,
    fontWeight: '300',
    lineHeight: 20,
    color: surface.muted,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 14,
  },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(130,112,162,0.16)' },
  orText: { fontSize: 12, color: surface.faint },
  fieldBlock: { gap: 5, marginBottom: 12 },
  fieldLabel: { fontSize: 11.5, fontWeight: '500', color: surface.faint },
  forgotWrap: { alignSelf: 'flex-start' },
  grow: { flex: 1 },

  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignSelf: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(123,92,188,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 62, height: 62 },
  page: { flex: 1, backgroundColor: surface.ground, padding: space.xl, paddingTop: 60 },
  /* מתג גלולה · כמו בקנבס, ולא שתי תוויות טקסט */
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.08)',
  },
  tab: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, color: '#8A8194' },
  tabOn: { color: '#43307A', fontWeight: '600' },
  field: {
    height: 48,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    fontSize: 15,
    textAlign: 'right',
    color: surface.ink,
  },
  cta: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: '#BCA7E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  err: { fontSize: 13, color: '#B95349', textAlign: 'center' },
  ghost: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontSize: 15, fontWeight: '600', color: '#6E6480' },
  link: { fontSize: type.label, color: '#8A8194', textAlign: 'center', paddingVertical: 6 },
  note: {
    marginTop: space.md,
    borderRadius: radius.card,
    padding: 20,
    backgroundColor: '#FEFCFB',
    alignItems: 'center',
    gap: 6,
  },
  noteTitle: { fontSize: 16, fontWeight: '600', color: surface.ink },
  noteBody: { fontSize: 13, color: surface.muted, textAlign: 'center' },
  noteBtn: {
    marginTop: space.md,
    height: 44,
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    backgroundColor: '#BCA7E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});

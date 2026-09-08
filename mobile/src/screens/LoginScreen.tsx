import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, space, surface, type } from '../theme/tokens';
import { useNav } from '../navigation/store';
import { apiEnabled } from '../api/config';
import { forgotPassword, googleStub, login, register } from '../api/auth';
import { authError, COPY } from '../api/copy';
import { ApiError } from '../api/types';

/** מסך הכניסה וההרשמה · הטאב הפתוח נקבע לפי המסך שממנו הגענו */
export function LoginScreen({ mode }: { mode: 'in' | 'up' }) {
  const { go, signIn } = useNav();
  const [tab, setTab] = useState<'in' | 'up'>(mode);
  const [who, setWho] = useState('');
  const [pass, setPass] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const isIn = tab === 'in';
  const can = who.trim().length > 2 && pass.trim().length >= 6 && !busy;

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
      <View style={s.tabs}>
        <Pressable onPress={() => setTab('in')} style={s.tab}>
          <Text style={[s.tabText, isIn && s.tabOn]}>כניסה</Text>
        </Pressable>
        <Pressable onPress={() => setTab('up')} style={s.tab}>
          <Text style={[s.tabText, !isIn && s.tabOn]}>הרשמה</Text>
        </Pressable>
      </View>

      <TextInput
        value={who}
        onChangeText={setWho}
        placeholder="טלפון או אימייל"
        placeholderTextColor="#B3ABBD"
        style={s.field}
      />
      <TextInput
        value={pass}
        onChangeText={setPass}
        placeholder="סיסמה"
        placeholderTextColor="#B3ABBD"
        secureTextEntry
        style={s.field}
      />

      <Pressable disabled={!can} onPress={onSubmit} style={[s.cta, { opacity: can ? 1 : 0.45 }]}>
        <Text style={s.ctaText}>{isIn ? 'כניסה' : 'יצירת חשבון'}</Text>
      </Pressable>

      {err ? <Text style={s.err}>{err}</Text> : null}

      <Pressable disabled={busy} onPress={onGoogle} style={s.ghost}>
        <Text style={s.ghostText}>המשך עם גוגל</Text>
      </Pressable>

      <Pressable onPress={onForgot}>
        <Text style={s.link}>שכחתי סיסמה</Text>
      </Pressable>

      <Pressable onPress={() => go('guest')}>
        <Text style={s.link}>להסתכל בלי חשבון</Text>
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
  page: { flex: 1, backgroundColor: surface.ground, padding: space.xl, paddingTop: 90, gap: space.md },
  tabs: { flexDirection: 'row', gap: space.lg, marginBottom: space.sm },
  tab: { paddingVertical: 6 },
  tabText: { fontSize: 17, color: '#8A8194' },
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

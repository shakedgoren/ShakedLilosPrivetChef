import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, surface } from '../theme/tokens';
import {
  ADDR,
  NO_NAME,
  PASS,
  PASS_FIELDS,
  PASS_PLACEHOLDERS,
  PERSONAL,
  PERSONAL_LABEL,
  PROFILE_TITLE,
  SAVED_LABEL,
  SAVE_LABEL,
  SECURITY_LABEL,
  SIGN_OUT,
  SINCE_LABEL,
} from '../data/profile';
import { useNav } from '../navigation/store';
import { useProfile, type Form, type Pass } from './profile/useProfile';

const BAD_BD = 'rgba(185,83,73,0.5)';
const IDLE_BD = 'rgba(130,112,162,0.18)';
const RED = '#B95349';

/** שדה עם תווית, גבול אדום בשגיאה ורמז מתחת */
function Field({
  label,
  value,
  onChange,
  placeholder,
  bad,
  hint,
  keyboardType,
  secure,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  bad?: boolean;
  hint?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  secure?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#B3ABBD"
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize="none"
        style={[s.input, { borderColor: bad ? BAD_BD : IDLE_BD }]}
      />
      {bad && hint ? <Text style={s.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

export function ProfileScreen() {
  const { signOut } = useNav();
  const p = useProfile();

  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{PROFILE_TITLE}</Text>
          <Text style={s.name}>{p.form.name.trim() || NO_NAME}</Text>
          <Text style={s.since}>{SINCE_LABEL}</Text>
        </View>

        <Text style={s.section}>{PERSONAL_LABEL}</Text>
        {PERSONAL.map((f) => (
          <Field
            key={f.id}
            label={f.label}
            value={p.form[f.id as keyof Form]}
            onChange={(v) => p.set(f.id as keyof Form, v)}
            placeholder={f.placeholder}
            bad={p.errors[f.id as keyof typeof p.errors]}
            hint={f.hint}
            keyboardType={f.type === 'tel' ? 'phone-pad' : f.type === 'email' ? 'email-address' : 'default'}
          />
        ))}

        <Text style={s.section}>{ADDR.label}</Text>
        <Field
          label={ADDR.note}
          value={p.form.addr}
          onChange={(v) => p.set('addr', v)}
          placeholder={ADDR.placeholder}
          bad={p.errors.addr}
          hint={ADDR.hint}
        >
          {p.suggestions.length > 0 ? (
            <View style={s.sug}>
              {p.suggestions.map((g) => (
                <Pressable key={g} onPress={() => p.set('addr', g)} style={s.sugRow}>
                  <Text style={s.sugText}>{g}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {p.noShip ? (
            <View style={s.noShip}>
              <Text style={s.noShipText}>{ADDR.noShip}</Text>
            </View>
          ) : null}
        </Field>

        <Pressable
          onPress={p.save}
          style={[s.save, { backgroundColor: p.canSave ? '#C6B3EC' : 'rgba(130,112,162,0.11)' }]}
        >
          <Text style={[s.saveText, { color: p.canSave ? '#43307A' : '#A79FB2' }]}>
            {SAVE_LABEL}
          </Text>
        </Pressable>
        {p.saved ? <Text style={s.savedNote}>{SAVED_LABEL}</Text> : null}

        <Text style={s.section}>{SECURITY_LABEL}</Text>
        <Pressable onPress={p.openPass} style={s.rowCard}>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>{PASS.title}</Text>
            <Text style={s.rowSub}>{PASS.sub}</Text>
          </View>
          <Text style={s.rowChev}>‹</Text>
        </Pressable>

        <Pressable onPress={p.askOut} style={s.outBtn}>
          <Text style={s.outText}>{SIGN_OUT.confirm}</Text>
        </Pressable>
      </ScrollView>

      {p.passOpen ? (
        <Modal visible transparent animationType="fade" onRequestClose={p.closePass}>
          <Pressable style={s.scrim} onPress={p.closePass} />
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{PASS.title}</Text>
            {PASS_FIELDS.map((f) => (
              <Field
                key={f.id}
                label={f.label}
                value={p.pass[f.id as keyof Pass]}
                onChange={(v) => p.setPassField(f.id as keyof Pass, v)}
                placeholder={PASS_PLACEHOLDERS[f.id as keyof typeof PASS_PLACEHOLDERS]}
                bad={p.passErrors[f.id as keyof typeof p.passErrors]}
                hint={f.hint}
                secure
              />
            ))}
            <Pressable onPress={p.savePass} style={[s.save, { opacity: p.passReady ? 1 : 0.45 }]}>
              <Text style={[s.saveText, { color: '#43307A' }]}>{PASS.cta}</Text>
            </Pressable>
          </View>
        </Modal>
      ) : null}

      {p.outOpen ? (
        <Modal visible transparent animationType="fade" onRequestClose={p.cancelOut}>
          <Pressable style={s.scrim} onPress={p.cancelOut} />
          <View style={s.confirm}>
            <Text style={s.sheetTitle}>{SIGN_OUT.title}</Text>
            <Text style={s.confirmBody}>{SIGN_OUT.body}</Text>
            <View style={s.confirmRow}>
              <Pressable onPress={p.cancelOut} style={[s.confirmBtn, s.keep]}>
                <Text style={s.keepText}>{SIGN_OUT.cancel}</Text>
              </Pressable>
              <Pressable onPress={signOut} style={[s.confirmBtn, s.leave]}>
                <Text style={s.leaveText}>{SIGN_OUT.confirm}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  list: { paddingTop: 30, paddingHorizontal: 18, paddingBottom: 120, gap: 10 },
  header: { gap: 2, marginBottom: 6 },
  title: { fontSize: 21, fontWeight: '600', color: surface.ink },
  name: { fontSize: 17, fontWeight: '600', color: '#43307A', marginTop: 6 },
  since: { fontSize: 12, fontWeight: '300', color: surface.faint },

  section: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, color: '#A79FB2', marginTop: 12 },
  field: { gap: 5 },
  label: { fontSize: 11.5, fontWeight: '500', color: surface.faint },
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
  hint: { fontSize: 11.5, fontWeight: '500', color: RED },

  sug: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: IDLE_BD,
  },
  sugRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130,112,162,0.1)',
  },
  sugText: { fontSize: 13, color: surface.ink },
  noShip: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(199,125,62,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(199,125,62,0.28)',
  },
  noShipText: { fontSize: 12, fontWeight: '600', color: '#A65E2A' },

  save: {
    height: 48,
    borderRadius: radius.pill,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6B3EC',
  },
  saveText: { fontSize: 15, fontWeight: '600' },
  savedNote: { fontSize: 12.5, fontWeight: '600', color: '#4E8A64', textAlign: 'center' },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: surface.ink },
  rowSub: { fontSize: 11.5, fontWeight: '300', color: surface.faint, marginTop: 1 },
  rowChev: { fontSize: 18, color: '#A79FB2' },

  outBtn: {
    height: 46,
    borderRadius: radius.pill,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(185,83,73,0.08)',
  },
  outText: { fontSize: 14, fontWeight: '600', color: RED },

  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(42,36,48,0.34)' },
  sheet: {
    position: 'absolute',
    top: 120,
    right: 16,
    left: 16,
    borderRadius: 28,
    padding: 20,
    gap: 12,
    backgroundColor: '#FEFCFB',
  },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: surface.ink },
  confirm: {
    position: 'absolute',
    top: 260,
    right: 20,
    left: 20,
    borderRadius: 26,
    padding: 20,
    gap: 8,
    backgroundColor: '#FEFCFB',
  },
  confirmBody: { fontSize: 13, color: surface.muted, lineHeight: 19 },
  confirmRow: { flexDirection: 'row', gap: 9, marginTop: 8 },
  confirmBtn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  keep: { backgroundColor: 'rgba(130,112,162,0.09)' },
  keepText: { fontSize: 14, fontWeight: '600', color: surface.inkSoft },
  leave: { backgroundColor: 'rgba(185,83,73,0.12)' },
  leaveText: { fontSize: 14, fontWeight: '600', color: RED },
});

import React from 'react';
import { TEXT_START } from '../theme/rtl';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, surface } from '../theme/tokens';
import { LEGAL_DOCS, LEGAL_PLACEHOLDER, LOGIN_COPY as T } from '../screens/loginCopy';
import { Clock } from '../icons';
import { Mail, Send } from './LoginIcons';

/**
 * שתי היריעות של מסך ההתחברות · התנאים ואיפוס הסיסמה.
 * ⚠ אינן מהקנבס · נוסחו בשיחה עם שקד ב-16 בספטמבר 2026.
 */

const LAV = '#BCA7E6';
const DEEP = '#43307A';

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <View style={s.layer}>
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grab} />
        {children}
      </View>
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
        {/* ⚠ **חובה להחליף לפני שחרור** · הנוסח המשפטי מגיע משקד */}
        <View style={s.ph}>
          <Text style={s.phText}>{LEGAL_PLACEHOLDER}</Text>
        </View>
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
    <Sheet onClose={onClose}>
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
        <View style={s.fieldIcon} pointerEvents="none">
          <Mail size={18} color="#9A93A6" />
        </View>
      </View>

      <Pressable onPress={onSend} disabled={busy} style={[s.cta, busy && s.ctaOff]}>
        <Send size={18} color="#FFFFFF" />
        <Text style={s.ctaText}>{T.forgotCta}</Text>
      </Pressable>

      <View style={s.ttl}>
        <Clock size={13} color={surface.faint} strokeWidth={1.8} />
        <Text style={s.ttlText}>{sent ? `${T.forgotTtl} · נשלח` : T.forgotTtl}</Text>
      </View>

      <Pressable onPress={onClose}>
        <Text style={s.close}>{T.close}</Text>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  layer: { ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }), zIndex: 20, justifyContent: 'flex-end' },
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
  ph: {
    backgroundColor: '#FFF7E9',
    borderWidth: 1,
    borderColor: '#E7C990',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 8,
  },
  phText: { fontSize: 11.5, fontWeight: '600', color: '#8A5A2A' },
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
    textAlign: TEXT_START,
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
  ctaOff: { opacity: 0.5 },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  ttl: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 10 },
  ttlText: { fontSize: 12, color: surface.faint },
  close: { fontSize: 12.5, color: '#8A8194', textAlign: 'center', paddingVertical: 10 },
  deep: { color: DEEP },
});

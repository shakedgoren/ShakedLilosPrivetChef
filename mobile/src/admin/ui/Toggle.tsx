import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';

const OFF_TRACK = 'rgba(130,112,162,0.22)';
const ON_TRACK = '#4E8A64';

type Props = {
  title: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  /** צבע המסלול הדלוק · ברירת המחדל היא ירוק ״פתוח״ */
  onColor?: string;
};

/** שורת מתג · כותרת, הסבר, ומתג בצד. חוזרת במסכי הניהול */
export function ToggleRow({ title, sub, on, onToggle, onColor = ON_TRACK }: Props) {
  return (
    <View style={s.row}>
      <View style={s.text}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
      <Pressable onPress={onToggle} hitSlop={8}>
        <View style={[s.track, { backgroundColor: on ? onColor : OFF_TRACK }]}>
          <View style={[s.knob, on ? s.knobOn : s.knobOff]} />
        </View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1 },
  title: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  sub: { fontSize: 11.5, fontWeight: '300', color: surface.muted, marginTop: 1 },
  track: { width: 52, height: 30, borderRadius: 999, justifyContent: 'center' },
  knob: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#3C3054',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  /* בקנבס הידית מתחילה בקצה ההתחלתי (right ב-RTL) וזזה 22px החוצה */
  knobOn: { start: 3 },
  knobOff: { start: 25 },
});

import React from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { surface } from '../../theme/tokens';

const BORDER = 'rgba(130,112,162,0.18)';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** גבול אדום כשהערך לא תקין */
  borderColor?: string;
  keyboardType?: KeyboardTypeOptions;
  /** שורת הערה מתחת לשדה · למשל ״לקוחה קיימת״ */
  note?: string;
  noteColor?: string;
  height?: number;
  children?: React.ReactNode;
};

/** שדה טקסט עם תווית · הצורה הקבועה של כל קלט במסכי הניהול */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  borderColor = BORDER,
  keyboardType,
  note,
  noteColor = surface.faint,
  height = 48,
  children,
}: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#B3ABBD"
        keyboardType={keyboardType}
        style={[s.input, { borderColor, height }]}
      />
      {note ? <Text style={[s.note, { color: noteColor }]}>{note}</Text> : null}
      {children}
    </View>
  );
}

/** תווית בלבד · לקבוצות שאינן שדה טקסט (צ׳יפים, מוני פריטים) */
export function FieldLabel({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

const s = StyleSheet.create({
  wrap: { gap: 5 },
  label: { fontSize: 11.5, fontWeight: '500', color: surface.faint },
  input: {
    borderRadius: 15,
    paddingHorizontal: 13,
    fontSize: 13.5,
    color: surface.ink,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    textAlign: 'right',
  },
  note: { fontSize: 11.5, fontWeight: '500' },
});

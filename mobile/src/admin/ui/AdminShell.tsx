import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { radius, surface } from '../../theme/tokens';

export type HeaderAction = { label: string; onPress: () => void; primary?: boolean };

type Props = {
  title: string;
  sub?: string;
  actions?: HeaderAction[];
  children: React.ReactNode;
};

/**
 * המעטפת של כל מסך ניהול · כותרת, כפתורי פעולה, ואזור התוכן.
 * כל 11 מסכי הניהול בקנבס בנויים על אותו שלד.
 */
export function AdminShell({ title, sub, actions = [], children }: Props) {
  return (
    <View style={s.root}>
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.title}>{title}</Text>
          {sub ? <Text style={s.sub}>{sub}</Text> : null}
        </View>
        {actions.map((act) => (
          <Pressable
            key={act.label}
            onPress={act.onPress}
            style={[s.action, act.primary ? s.actionPrimary : s.actionGhost]}
          >
            <Text style={s.actionText}>{act.primary ? `+ ${act.label}` : act.label}</Text>
          </Pressable>
        ))}
      </View>
      {children}
    </View>
  );
}

/** רצועת המספרים של היום · שלושה ערכים מוצגים זה לצד זה */
export function KpiRow({
  kpis,
  style,
}: {
  kpis: { k: string; v: number | string; fg: string }[];
  /** דורס את רקע הרצועה · במסך התפריט היא נצבעת בגוון הקטגוריה */
  style?: ViewStyle;
}) {
  return (
    <View style={[s.kpiBar, style]}>
      {kpis.map((kpi) => (
        <View key={kpi.k} style={s.kpi}>
          <Text style={[s.kpiValue, { color: kpi.fg }]}>{kpi.v}</Text>
          <Text style={s.kpiLabel}>{kpi.k}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 30, paddingHorizontal: 18, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headText: { flex: 1, gap: 2 },
  title: { fontSize: 21, fontWeight: '600', color: surface.ink },
  sub: { fontSize: 12.5, fontWeight: '300', color: surface.faint },
  action: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGhost: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.22)',
  },
  actionPrimary: { backgroundColor: '#C6B3EC' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#43307A' },
  kpiBar: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  kpi: { flex: 1, alignItems: 'center', gap: 1 },
  kpiValue: { fontSize: 17, fontWeight: '600' },
  kpiLabel: { fontSize: 10.5, fontWeight: '300', color: surface.faint },
});

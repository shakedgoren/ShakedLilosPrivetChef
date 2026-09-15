import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { radius, surface } from '../../theme/tokens';
import { ChevronRight, type IconProps } from '../../icons';
import { useNav } from '../../navigation/store';

export type HeaderAction = {
  label: string;
  onPress: () => void;
  primary?: boolean;
  /**
   * אייקון במקום המילה · בקשה של שקד (15 בספטמבר 2026) בכמה מסכים,
   * כדי שהכותרת והכפתורים ייכנסו בשורה אחת כמו בקנבס.
   * ה-`label` נשאר כשם הנגישות של הכפתור.
   */
  icon?: (p: IconProps) => React.JSX.Element;
  /** הכפתור מושבת · אפור ולא מגיב */
  off?: boolean;
  /**
   * גלולה בגוון סגול עם אייקון **וגם** מילה · כך נראה כפתור
   * ״ייבוא״ בקנבס של עלויות הייצור: גובה 36, ריפוד 14,
   * רקע rgba(123,92,188,0.13) וכיתוב 12.5 במשקל 600.
   */
  tint?: boolean;
};

type Props = {
  title: string;
  /** גודל הכותרת · 21 ברוב המסכים, 17 בקניות כמו בקנבס */
  titleSize?: number;
  sub?: string;
  actions?: HeaderAction[];
  children: React.ReactNode;
};

/**
 * המעטפת של כל מסך ניהול · כותרת, כפתורי פעולה, ואזור התוכן.
 * כל 11 מסכי הניהול בקנבס בנויים על אותו שלד.
 *
 * ⚠ **חץ החזרה** · שקד ביקשה (15 בספטמבר 2026) כפתור ״>״ בכל דף
 * פנימי. הוא יושב כאן ולא בכל מסך בנפרד, כדי שלא יישכח באחד מהם.
 * ⚠ החץ הוא `ChevronRight` ולא תו ‹ · תווי חץ נהפכים ב-RTL,
 * וזה מה שהפך את החצים במפות ההגעה.
 */
export function AdminShell({ title, titleSize = 21, sub, actions = [], children }: Props) {
  const { back, canBack, go } = useNav();
  return (
    <View style={s.root}>
      <View style={s.head}>
        {/* ⚠ תמיד מוצג · כשאין מחסנית (כניסה ישירה לכתובת) הוא
            מחזיר לדף הניהול, כדי שלא יהיה מסך פנימי בלי דרך חזרה. */}
        <Pressable onPress={canBack ? back : () => go('admin')} style={s.back} hitSlop={10}>
          <ChevronRight size={16} color="#6E6478" strokeWidth={2} />
        </Pressable>
        <View style={s.headText}>
          {/* ⚠ שורה אחת · הכותרת של הקניות ארוכה והיא נשברה לשתיים */}
          <Text style={[s.title, { fontSize: titleSize }]} numberOfLines={1}>
            {title}
          </Text>
          {sub ? <Text style={s.sub}>{sub}</Text> : null}
        </View>
        {actions.map((act) => (
          <Pressable
            key={act.label}
            onPress={act.off ? undefined : act.onPress}
            accessibilityLabel={act.label}
            style={[
              s.action,
              act.tint ? s.actionTintBox : act.icon ? s.actionIcon : null,
              act.tint
                ? null
                : act.primary
                  ? s.actionPrimary
                  : act.icon
                    ? s.actionGhostRound
                    : s.actionGhost,
              act.off ? s.actionOff : null,
            ]}
          >
            {act.icon && act.tint ? (
              <>
                <act.icon size={14} color="#43307A" strokeWidth={2.2} />
                <Text style={s.actionTint}>{act.label}</Text>
              </>
            ) : act.icon ? (
              <act.icon size={16} color={act.primary ? '#43307A' : '#6E6478'} strokeWidth={2.2} />
            ) : (
              <Text style={s.actionText}>{act.primary ? `+ ${act.label}` : act.label}</Text>
            )}
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
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1, gap: 2 },
  title: { fontWeight: '600', color: surface.ink },
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
  /* הגרסה העגולה של הכפתור הרגיל · אפור רך, בלי מסגרת, כמו בקנבס */
  actionGhostRound: { backgroundColor: 'rgba(130,112,162,0.09)', borderWidth: 0 },
  /* ⚠ כפתור אייקון · **עיגול** 38×38, בדיוק כמו בקנבס של הקניות */
  actionIcon: { width: 38, height: 38, borderRadius: 19, paddingHorizontal: 0 },
  actionPrimary: { backgroundColor: '#C6B3EC' },
  actionOff: { opacity: 0.4 },
  /* גלולת האייקון-והמילה של הקנבס · עלויות ייצור */
  actionTintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(123,92,188,0.13)',
  },
  actionTint: { fontSize: 12.5, fontWeight: '600', color: '#43307A' },
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

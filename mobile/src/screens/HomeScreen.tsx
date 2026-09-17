import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appear } from '../components/Appear';
import { Masthead } from '../components/Masthead';
import { CategoryCarousel } from '../components/CategoryCarousel';
import { CategoryRail } from '../components/CategoryRail';
import { PhotoReel, REEL_BOTTOM } from '../components/PhotoReel';
import { BAR_BOTTOM_WITH_NAV } from '../components/BottomNav';
import { PrimaryButton } from '../components/PrimaryButton';
import { CATEGORIES } from '../data/categories';
import { space } from '../theme/tokens';
import { useNav, type Screen } from '../navigation/store';
import { SaleAlert } from '../components/SaleAlert';
import { SaleDayRow } from '../components/SaleDayRow';
import { apiEnabled } from '../api/config';
import { syncReminders } from '../order/reminders';
import { listNotifications, markNotificationSeen, type SaleNotification } from '../api/orders';

/**
 * הכיתוב על כפתור הכניסה · שקד ביקשה את הנוסח הזה.
 * ⚠ **היה ״להתחברות והזמנה״** · קוצר ל״להתחברות״ לבקשתה, 16.9.2026.
 */
const CTA_LABEL = 'להתחברות';

/**
 * המרווח שמחליף את גוש הכפתור אחרי ההתחברות · בקשה של שקד.
 * ⚠ לא מהקנבס.
 */
const RAIL_GAP = 26;

/**
 * תחתית הדף אחרי ההתחברות.
 * ⚠ היה 120, ועם ה-40 של רצועת התמונות נוצרו 160 פיקסלים של
 * ״שטח מת״ שאפשר לגלול אליהם. הנאב-בר תופס 94 מהתחתית, ולכן
 * `BAR_BOTTOM_WITH_NAV` פחות ה-40 של הרצועה הוא בדיוק מה שצריך.
 */
const HOME_PAD_NAV = BAR_BOTTOM_WITH_NAV - REEL_BOTTOM;

/**
 * דף הבית · משמש גם לפני ההתחברות וגם אחריה.
 * ההבדל היחיד: לפני התחברות מוצג כפתור הכניסה,
 * אחרי התחברות מוצגת תיבת המכירה הקרובה — כמו בקנבס.
 */
/**
 * הקטגוריה שהייתה במרכז · נשמרת ברמת המודול.
 *
 * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״כשאני חוזרת אחורה לדף
 * הראשי במידה והייתי בתוך ספיישל — שיחזיר אותי למצב שהספיישל הוא
 * זה שבקטגוריה הראשית, ולא אוטומטית לקטגוריה הראשונה״.
 *
 * דף הבית מורכב מחדש בכל חזרה אליו, ולכן מצב פנימי מתאפס. ברמת
 * המודול הוא שורד את החזרה ומתאפס רק בהפעלה מחדש של האפליקציה —
 * וזה בדיוק הטווח שהיא ביקשה.
 */
let lastActive = 0;

export function HomeScreen() {
  const { loggedIn, go } = useNav();
  const [active, setActive] = useState(lastActive);

  /* ⚠ כל שינוי מרכז נשמר · גם גלילה בקרוסלה וגם לחיצה ברצועה */
  const pick = useCallback((i: number) => {
    lastActive = i;
    setActive(i);
  }, []);

  /** פתיחת קטגוריה · זוכרת אותה בדרך החוצה */
  const open = useCallback(
    (key: string) => {
      const i = CATEGORIES.findIndex((c) => c.key === key);
      if (i >= 0) lastActive = i;
      go(key as Screen);
    },
    [go],
  );

  /**
   * ⚠ ההתראות של ״תזכירו לי״ · שקד החליטה שהתזכורת מגיעה כהתראה
   * בתוך האפליקציה, ולכן היא נבדקת בכל כניסה לדף הבית.
   */
  const [alerts, setAlerts] = useState<SaleNotification[]>([]);

  useEffect(() => {
    if (!loggedIn || !apiEnabled) {
      setAlerts([]);
      return;
    }
    /* ⚠ מצב התזכורות נטען כאן לכל הקטגוריות · ראו `syncReminders` */
    void syncReminders();
    let live = true;
    listNotifications()
      .then(({ notifications }) => {
        if (live) setAlerts(notifications);
      })
      /* התראה היא בונוס · כישלון שלה לא אמור לשבור את דף הבית */
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [loggedIn]);

  const dismiss = useCallback((n: SaleNotification) => {
    setAlerts((list) => list.filter((x) => x.category !== n.category));
    void markNotificationSeen(n.category, n.date).catch(() => {});
  }, []);

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={[s.content, { paddingBottom: loggedIn ? HOME_PAD_NAV : 0 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ⚠ **כניסה מדורגת · בקשת שקד (17 בספטמבר 2026)** · ״כל
          האובייקטים מופיעים על המסך אחד אחד״. רץ פעם אחת בפתיחת
          האפליקציה בלבד · ראו `Appear`. */}
      <Appear index={0}>
        <Masthead />
      </Appear>

      {/* ההתראות · ״המכירה נפתחה״ למי שביקשה שנזכיר */}
      {alerts.map((n) => (
        <SaleAlert
          key={n.category}
          category={n.category}
          onOpen={() => {
            dismiss(n);
            open(n.category);
          }}
          onDismiss={() => dismiss(n)}
        />
      ))}

      {loggedIn ? (
        <Appear index={1}>
          <SaleDayRow onOpen={open} />
        </Appear>
      ) : null}

      <Appear index={2}>
        <CategoryCarousel
          items={CATEGORIES}
          active={active}
          onActiveChange={pick}
          onOpen={open}
        />
      </Appear>

      <Appear index={3}>
        <CategoryRail items={CATEGORIES} active={active} onActiveChange={pick} />
      </Appear>

      {!loggedIn && (
        <Appear index={4}>
          <View style={s.cta}>
            <PrimaryButton label={CTA_LABEL} onPress={() => go('login')} />
          </View>
        </Appear>
      )}

      {/* ⚠ לפני התחברות גוש הכפתור מפריד בין הקטגוריות לרצועה.
          אחריה אין כפתור, ולכן שקד ביקשה מרווח במקומו. */}
      {loggedIn && <View style={s.railGap} />}

      {/* רצועת התמונות · בקנבס היא יושבת מתחת לכפתורים */}
      <Appear index={5}>
        <PhotoReel />
      </Appear>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.xxl },

  cta: { alignItems: 'center', paddingTop: 30, paddingBottom: 18 },
  railGap: { height: RAIL_GAP },
});

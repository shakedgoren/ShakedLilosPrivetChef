/**
 * מה שנקנה → רשימת מצרכים לבחירה בעלויות הייצור.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״במידה ואני רוצה לייבא
 * מוצרים ומחירים כלשהם מהקניות אני רוצה, נגיד שאני עומדת על
 * מפרום, שאני אוכל ללחוץ על ייבוא ואז לסמן דברים מהקניות ששימשו
 * אותי להכנת המנה, ואז הם ייכנסו לעלויות של המוצר — ולא באופן
 * אוטומטי״.
 *
 * ⚠ **מה שהיה קיים אינו זה** · `POST /admin/costs/import/:listId`
 * עובר על **כל** המנות ומעדכן מחיר לכל מצרך ששמו תואם שורה
 * ברשימה. הוא מרענן מחירים של מה שכבר מוגדר, ואינו יכול להוסיף
 * מצרך למנה אחת. זה בדיוק ה״אוטומטי״ שהיא ביקשה שלא.
 *
 * ⚠⚠ **מחיר ליחידה, לא סכום השורה** · שורת קנייה מחזיקה **מחיר
 * ליחידה** (`price`) וגם **סכום ששולם בפועל** (`actual`), והשניים
 * אינם אותו דבר: ‎12 ק״ג ירך עוף ב-40 ₪ לק״ג הם 480 ₪. במנת מתכון
 * המחיר מוכפל בכמות, ולכן מה שנכנס לשם חייב להיות **ליחידה**.
 * כשיש סכום בפועל הוא מחולק בכמות, וכך הייבוא מביא את המחיר
 * ששולם באמת ולא את ההערכה.
 *
 * ⚠ **אותו שם פעמיים · המחיר החדש גובר** · מצרך נקנה שוב ושוב,
 * ומה שמעניין בעלויות הוא כמה הוא עולה **היום**.
 */

export type ShopLine = {
  name: string;
  g?: string;
  unit?: string;
  qty?: string;
  price?: string;
  actual?: string;
  done?: boolean;
};

export type PantryPick = {
  /** שם המצרך · כפי שהוקלד ברשימת הקניות */
  name: string;
  /** קבוצת המצרך · ״ירקות ופירות״, ״אריזות״ … */
  g: string;
  /** ״ק״ג״ · מוצג לצד המחיר כדי שהמחיר יהיה מובן */
  unit: string;
  /** מחיר ליחידה · ראו ההערה למעלה */
  price: number;
  /** מתי נקנה לאחרונה · ISO. ריק כשהרשימה עדיין פתוחה */
  at: string;
};

const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** מחיר ליחידה של שורת קנייה · ראו ההערה למעלה */
export function unitPriceOf(line: ShopLine): number {
  const qty = num(line.qty);
  const actual = String(line.actual ?? '').trim();
  if (actual !== '' && qty > 0) return num(actual) / qty;
  return num(line.price);
}

/**
 * ⚠ **רק מה שנקנה בפועל** · שורה שלא סומנה היא כוונה, לא קנייה,
 * והמחיר שבה הוא הערכה. שקד ביקשה את ״דברים מהקניות ששימשו אותי
 * להכנת המנה״.
 */
export function pantryFromShop(
  lists: { closedAt: Date | null; items: ShopLine[] }[],
): PantryPick[] {
  const byName = new Map<string, PantryPick>();

  /* ⚠ מהישן לחדש · כך הרשומה האחרונה היא זו שנשארת */
  const sorted = [...lists].sort(
    (a, b) => (a.closedAt?.getTime() ?? Infinity) - (b.closedAt?.getTime() ?? Infinity),
  );

  for (const list of sorted) {
    for (const line of list.items) {
      const name = String(line.name ?? '').trim();
      if (!name || !line.done) continue;
      const price = unitPriceOf(line);
      if (!(price > 0)) continue;
      byName.set(name, {
        name,
        g: String(line.g ?? '').trim(),
        unit: String(line.unit ?? '').trim(),
        /* ⚠ אגורות · מחיר ליחידה אחרי חלוקה אינו שלם */
        price: Math.round(price * 100) / 100,
        at: list.closedAt ? list.closedAt.toISOString() : '',
      });
    }
  }

  /* ⚠ לפי קבוצה ואז לפי שם · כך הסל בוחר כמו שהוא קונה */
  return [...byName.values()].sort(
    (a, b) => a.g.localeCompare(b.g, 'he') || a.name.localeCompare(b.name, 'he'),
  );
}

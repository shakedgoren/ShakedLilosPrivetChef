# BITE & TELL · שרת

API ב-Node/TypeScript + Express + Prisma + SQLite (מקומי).
המחירים והקטלוג מגיעים מ-`mobile/src/data/` — לא מוקלדים שוב.

אין מע״מ (עוסק פטור). סליקה ווואטסאפ מחוץ להיקף.

## הרצה מקומית

```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

השרת עולה על `http://localhost:3001`.

בלי Docker. קובץ הדאטה הוא `server/prisma/dev.db`.

ל-Postgres בפרודקשן: החליפי `DATABASE_URL` ב-.env לחיבור Postgres, ושני ב-`prisma/schema.prisma` את `provider` ל-`postgresql`, ואז `prisma migrate dev`.

## בדיקות

```bash
npm test          # תמחור מול הקטלוג הקיים
npm run smoke     # נרשמת · מזמינה קוסקוס · שולפת כמשתמשת וכמנהלת
```

`smoke` מרים שרת זמני על SQLite נפרד ואינו דורש `npm run dev`.

## האפליקציה

ב-`mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

ואז `cd mobile && npx expo start --web`.

בלי המשתנה הזה נשארת התחברות הדמה (כמו קודם).

במכשיר אמיתי צריך את כתובת המחשב ברשת, לא `localhost`.

## חשבון ניהול (אחרי seed)

- אימייל: `shaked@localhost`
- סיסמה: `changeme` (או מה ששמת ב-`.env`)

## נתיבים

| שיטה | נתיב | מי | מה |
|---|---|---|---|
| GET | `/health` | כולם | חי |
| POST | `/auth/register` | | `{ who, password, name? }` · who = אימייל או טלפון |
| POST | `/auth/login` | | `{ who, password }` |
| POST | `/auth/forgot-password` | | `{ who }` · תמיד `{ ok: true }`. עם `RESET_DEBUG=1` מוחזר גם `resetToken` |
| POST | `/auth/reset-password` | | `{ token, password }` |
| POST | `/auth/google` | | stub · `501 google_not_configured` עד שיוגדר `GOOGLE_CLIENT_ID` |
| GET | `/auth/me` | JWT | המשתמשת המחוברת |
| GET/PATCH | `/users/me` | JWT | פרופיל: name, phone, address, city |
| POST | `/orders` | JWT · שף גם בלי | יצירת הזמנה. השרת מחשב מחיר מהקטלוג |
| GET | `/orders` | JWT | ההזמנות שלי |
| GET | `/orders/:id` | JWT / admin | הזמנה אחת |
| GET | `/admin/orders` | admin | `?status=&category=&q=` |
| GET | `/admin/orders/:id` | admin | |
| PATCH | `/admin/orders/:id/status` | admin | `{ status, reason?, note? }` |
| POST | `/admin/orders` | admin | הזמנה ידנית (קוסקוס / שישניצל לפי התפריט ב-admin) |
| GET | `/admin/customers` | admin | לקוחות עם ספירת הזמנות, מחזור והערה |
| PATCH | `/admin/customers/:id` | admin | `{ note }` |
| GET/PUT | `/admin/days` · `/admin/days/:date` | admin | לוח ימי מכירה, מכסות, חסימות |
| GET | `/admin/stock/sale` | admin | מלאי מכירה מימים פתוחים |
| PATCH | `/admin/stock/sale/:date/waste` | admin | `{ dishId, waste }` |
| GET/POST/PATCH/DELETE | `/admin/stock/supply` | admin | מלאי לוגיסטי |
| GET/PUT | `/admin/shop/active` | admin | רשימת הקניות הפתוחה |
| POST | `/admin/shop/active/close` | admin | סגירה · הוצאה + היסטוריה |
| GET | `/admin/shop/history` | admin | קניות שנסגרו |
| GET | `/admin/money?period=month\|quart\|year` | admin | מחזור, הוצאות, רווח (בלי פירות, בלי מע״מ) |
| GET | `/admin/menu` | admin | מחיר/עלות/רווח ממסך העלויות |
| GET/PUT | `/admin/costs` · `/admin/costs/:id` | admin | מתכוני ייצור |
| POST | `/admin/costs/import/:listId` | admin | ייבוא מחירים מקנייה |
| GET | `/admin/summary` | admin | בית הניהול |
| GET | `/admin/board` | admin | לוח מכירה · `?date=&category=` |
| PATCH | `/admin/orders/:id/qty` | admin | עדכון כמויות בלוח (קוסקוס) |


Authorization: `Bearer <token>`.

### גוף הזמנת לקוחה (`POST /orders`)

```json
{
  "ship": "self",
  "time": "12:30",
  "pay": "ביט",
  "details": { "category": "cous", "qty": [2, 1, 0, 0, 0, 0] }
}
```

קטגוריות:

- `cous` — `qty` לפי סדר `COUSCOUS_MENU`
- `schn` — `{ mode: "unit"|"box", rolls, box, cocottes }`
- `fruit` — `qty` לפי `FRUIT_TRAYS`
- `box` — `{ key, picks }` · `priceOfBox`
- `chef` — `{ key, picks }` · `priceOfPackage` · מותר בלי חשבון

משלוח: `ship: "deliv"`, `city` מתוך רשימת הערים, `address` עם מספר בית.
חלונות הזמן נלקחים מאותם קבצי fulfillment שבאפליקציה.

### מצבים

`חדשה` → `מאושרת` → `בהכנה` → `מוכנה` → `נמסרה` · ו-`בוטלה` מכל מצב שטרם נמסר.

אפשר לשלוח גם את השמות באנגלית: `new / confirmed / preparing / ready / delivered / cancelled`.

## סכמה

- `User` — role `customer` | `admin`, email ו/או phone, name, address, city, note
- `PasswordReset` — טוקן לשעה
- `Order` — category, status, fulfillment, `itemsJson` / `detailsJson`, `itemsTotal` + `shippingFee` + `total` (בלי מע״מ)
- `SaleDay` — תאריך, חסימה, קטגוריה, פתוח/סגור, מכסות, מנות שירדו
- `SupplyItem` — מלאי לוגיסטי
- `ShoppingList` — רשימת קניות פתוחה או סגורה (היסטוריה)
- `ProductionDish` — מתכון ומחיר ליחידה (מסך עלויות → תפריט)
- `Expense` — הוצאה לפי קטגוריה / חודש

הזמנת לקוחה מהאפליקציה **לא** מוסיפה דמי משלוח (המסך הנוכחי לא גובה אותם). הזמנה ידנית בניהול כן, לפי `SHIP_FEE` (יבנה 20 / אחר 60).

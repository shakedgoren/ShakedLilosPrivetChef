# BITE & TELL · שרת

API ב-Node/TypeScript + Express + Prisma.
ברירת המחדל: **SQLite מקומי**. אפשר **Postgres מקומי** דרך Docker Compose — בלי ענן.

המחירים והקטלוג מגיעים מ-`mobile/src/data/` — לא מוקלדים שוב.

אין מע״מ (עוסק פטור). סליקה ווואטסאפ מחוץ להיקף.

## הרצה מקומית · SQLite (ברירת מחדל)

בלי Docker. קובץ הדאטה הוא `server/prisma/dev.db`.

```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

השרת עולה על `http://localhost:3001`.

## הרצה מקומית · Postgres (Docker Compose)

לא מחליף את מסלול ה-SQLite. `prisma/schema.prisma` נשאר sqlite; ל-Postgres נוצר `prisma/schema.postgresql.prisma` בזמן `db:postgres:push` (לא בגיט).

```bash
cd server
cp .env.example .env
# ב-.env הכבי את שורת ה-SQLite והפעילי:
# DATABASE_URL="postgresql://bite:bite@localhost:5432/biteandtell"

docker compose up -d          # או: npm run db:postgres:up
npm install
npm run db:postgres:push      # db push + prisma generate ל-Postgres
npm run db:seed
npm run dev
```

חזרה ל-SQLite: `DATABASE_URL="file:./dev.db"` ב-`.env`, ואז `npx prisma generate` (ולפי הצורך `npx prisma migrate dev`).

`docker compose down` עוצר את Postgres. הווליום `bite_pg_data` שומר את הנתונים עד `docker compose down -v`.

## בדיקות

```bash
npm test          # תמחור, ימי מכירה, מכסות, טוקן גוגל לבדיקות
npm run smoke     # נרשמת · מכסות · הזמנה · להזמין שוב · גוגל 501 · תמונת פרופיל
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
| POST | `/auth/google` | | `{ idToken }` · אימות Google ID token כש-`GOOGLE_CLIENT_ID` מוגדר. בלי זה `501 google_not_configured` |
| GET | `/auth/me` | JWT | המשתמשת המחוברת |
| GET/PATCH | `/users/me` | JWT | פרופיל: name, phone, address, city, וגם `image`/`imageBase64` ב-PATCH |
| POST | `/users/me/photo` | JWT | תמונת פרופיל · multipart שדה `photo` או JSON `{ image: "data:image/png;base64,..." }` |
| GET | `/uploads/avatars/:file` | כולם | קובץ תמונה שנשמר מקומית |
| POST | `/orders` | JWT · שף גם בלי | יצירת הזמנה. השרת מחשב מחיר מהקטלוג ובודק יום מכירה/מכסות |
| POST | `/orders/:id/reorder` | JWT | להזמין שוב · אותם פריטים, מחיר מהקטלוג, יום מכירה הבא הפתוח |
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
  "saleDate": "2026-09-15",
  "details": { "category": "cous", "qty": [2, 1, 0, 0, 0, 0] }
}
```

`saleDate` בפורמט `YYYY-MM-DD`. אם חסר (או מגיע תווית עברית מהאפליקציה), השרת בוחר את יום המכירה הפתוח הבא לאותה קטגוריה.

קטגוריות:

- `cous` — `qty` לפי סדר `COUSCOUS_MENU`
- `schn` — `{ mode: "unit"|"box", rolls, box, cocottes }`
- `fruit` — `qty` לפי `FRUIT_TRAYS`
- `box` — `{ key, picks }` · `priceOfBox`
- `chef` — `{ key, picks }` · `priceOfPackage` · מותר בלי חשבון

משלוח: `ship: "deliv"`, `city` מתוך רשימת הערים, `address` עם מספר בית.
חלונות הזמן נלקחים מאותם קבצי fulfillment שבאפליקציה.

הזמנת **קוסקוס / שישניצל** נדחית אם היום חסום, סגור, לא יום המכירה של הקטגוריה, או אם המכסה מלאה (כולל מנות שירדו). שף / ספיישל / פירות לא כפופים ליום שלישי/שישי, אבל יום חסום בלי חריגה נחסם גם להם.

קודים: `day_closed` · `day_blocked` · `category_closed` · `quota_exceeded` (409) · הודעה בעברית בשדה `message`.

הזמנות ידניות מ-`POST /admin/orders` **לא** עוברות את בדיקת המכסות (המנהלת יכולה לחרוג).

### להזמין שוב (`POST /orders/:id/reorder`)

משכפל את `detailsJson` של הזמנה קודמת של אותה משתמשת. **לא** סומך על סכומים מהלקוחה — המחיר מחושב מהקטלוג. יום המכירה הוא הבא הפתוח (אלא אם נשלח `saleDate`).

```json
POST /orders/:id/reorder
Authorization: Bearer <token>
{ "ship": "self", "time": "12:30", "pay": "ביט" }
```

גוף אופציונלי: `ship`, `time`, `city`, `address`, `pay`, `saleDate`, `name`, `phone`. בלי גוף — מועתקים מההזמנה המקורית. הזמנות שנזרעו בלי פרטי לקוחה מחזירות `reorder_unavailable`.

### התחברות עם גוגל (`POST /auth/google`)

```json
{ "idToken": "<Google ID token מהלקוח>" }
```

כש-`GOOGLE_CLIENT_ID` מוגדר (אפשר כמה מזהים בפסיק), השרת מאמת מול Google, מוצא או יוצר משתמשת לפי `googleId` / אימייל, ומחזיר `{ token, user }` כמו ב-login. בלי המשתנה: `501 { "error": "google_not_configured" }`. טוקן חסר: `400 google_token_required`. טוקן לא תקין: `401 invalid_google_token`.

### תמונת פרופיל

`POST /users/me/photo` (JWT):

- `multipart/form-data` עם קובץ בשדה `photo`
- או JSON `{ "image": "data:image/png;base64,..." }` / `{ "imageBase64": "..." }`

נשמר ב-`uploads/avatars/<userId>.<ext>` ומוחזר ב-`user.avatarUrl` (נתיב יחסי, למשל `/uploads/avatars/...`). אותו שדה מתקבל גם ב-`PATCH /users/me`. jpeg / png / webp / gif, עד 2MB. הקבצים מוגשים ב-`GET /uploads/...`.

### מצבים

`חדשה` → `מאושרת` → `בהכנה` → `מוכנה` → `נמסרה` · ו-`בוטלה` מכל מצב שטרם נמסר.

אפשר לשלוח גם את השמות באנגלית: `new / confirmed / preparing / ready / delivered / cancelled`.

## סכמה

- `User` — role `customer` | `admin`, email ו/או phone, googleId, name, address, city, note, avatarUrl
- `PasswordReset` — טוקן לשעה
- `Order` — category, status, fulfillment, `itemsJson` / `detailsJson`, `itemsTotal` + `shippingFee` + `total` (בלי מע״מ)
- `SaleDay` — תאריך, חסימה, קטגוריה, פתוח/סגור, מכסות, מנות שירדו
- `SupplyItem` — מלאי לוגיסטי
- `ShoppingList` — רשימת קניות פתוחה או סגורה (היסטוריה)
- `ProductionDish` — מתכון ומחיר ליחידה (מסך עלויות → תפריט)
- `Expense` — הוצאה לפי קטגוריה / חודש

הזמנת לקוחה מהאפליקציה **לא** מוסיפה דמי משלוח (המסך הנוכחי לא גובה אותם). הזמנה ידנית בניהול כן, לפי `SHIP_FEE` (יבנה 20 / אחר 60).

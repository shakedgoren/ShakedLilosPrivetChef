# BITE & TELL · שרת

API ב-Node/TypeScript + Express + Prisma.
ברירת המחדל: **SQLite מקומי**. אפשר **Postgres מקומי** דרך Docker Compose — בלי ענן.

המחירים והקטלוג מגיעים מ-`mobile/src/data/` — לא מוקלדים שוב.

אין מע״מ (עוסק פטור). סליקה מחוץ להיקף. וואטסאפ Cloud API אופציונלי — בלי משתני הסביבה השרת רץ כרגיל.

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
| POST | `/auth/forgot-password` | | `{ who }` · תמיד `{ ok: true }`. קישור איפוס נשלח למייל אם יש כתובת; קוד OTP בוואטסאפ אם יש טלפון. עם `RESET_DEBUG=1` מוחזר גם `resetToken` |
| POST | `/auth/reset-password` | | `{ token, password }` · `token` יכול להיות קוד OTP או טוקן ארוך |
| POST | `/auth/otp/request` | | `{ who }` · תמיד `{ ok: true }`. שולח תבנית Authentication אם יש טלפון ו-WhatsApp מוגדר. עם `RESET_DEBUG=1` מוחזר `code` |
| POST | `/auth/otp/verify` | | `{ who, code }` · מאמת את הקוד ומחזיר `{ token, user }` כמו login |
| GET | `/webhooks/whatsapp` | Meta | אימות webhook · `hub.mode` + `hub.verify_token` + `hub.challenge` |
| POST | `/webhooks/whatsapp` | Meta | קבלת סטטוסי מסירה (stub · תמיד 200) |
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

### WhatsApp Cloud API (ישירות מול Meta)

שליחה אוטומטית של **קוד אימות (OTP)** ו**אישור/סטטוס הזמנה** דרך WhatsApp Cloud API — בלי ספק BSP. SMS לא כלול.

בלי `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` **לא נשלח כלום** והשרת עולה כרגיל. `GET /health` מחזיר `"whatsapp": false`.

#### מספר מחובר

| | |
|---|---|
| תצוגה | **+972 52-505-6708** |
| `WHATSAPP_PHONE_NUMBER_ID` | `1318024191397722` |
| `WHATSAPP_WABA_ID` | `1753798195905322` |

אלה המזהים של המספר המחובר. לא להשתמש במזהים הישנים `1232590293281581` / `4591151791157354` / `1378990205287782` / `2026174634698902`, ולא במספרי תצוגה ישנים (`+972 52-977-0915`, `+1 555…`).

שליחה חיה עדיין חסומה: אמצעי תשלום ב-Meta ואימות עסקי. התבניות, כולל `order_dely`, מאושרות על ה-WABA הזה. `WHATSAPP_TOKEN` לא נכנס לגיט.

#### מה שקד ממלאת ב-Meta

1. [developers.facebook.com](https://developers.facebook.com) → אפליקציה → WhatsApp → API Setup.
2. המספר המחובר **+972 52-505-6708** → **Phone number ID** `1318024191397722`.
3. System user ב-Business Manager עם הרשאה ל-WhatsApp → **Permanent token** (`whatsapp_business_messaging`, `whatsapp_business_management`). מדביקים רק ב-`.env` או ב-Railway Variables.
4. מזהה WABA `1753798195905322` — רק לתיעוד / יצירת תבניות, לא חובה לשליחה.
5. התבניות בעברית (`he`) **מאושרות על ה-WABA הזה**, כולל `order_dely`. **השמות למטה הם השמות ב-Meta — כולל שגיאות הכתיב, לא לתקן:**

| משתנה | שם ב-Meta | קטגוריה | מתי נשלח |
|---|---|---|---|
| `WHATSAPP_TEMPLATE_OTP` | `bite_otp` | Authentication · Copy code | עדיין חסרה אצל שקד · הנתיב בשרת כבר מוכן |
| `WHATSAPP_TEMPLATE_ORDER_CONFIRMED_PICKUP` | `order_pickup_confirmed` | Utility | יצירת הזמנת איסוף (`ship=self`) |
| `WHATSAPP_TEMPLATE_ORDER_CONFIRMED_DELIVERY` | `order_dely` | Utility | יצירת הזמנת משלוח (`ship=deliv`) · **dely** |
| `WHATSAPP_TEMPLATE_ORDER_READY_PICKUP` | `order_pick_up` | Utility | סטטוס **מוכנה** בהזמנת איסוף |
| `WHATSAPP_TEMPLATE_ORDER_DELIVERED` | `order_dalivery` | Utility | סטטוס **נמסרה** בהזמנת משלוח · **dalivery** |

מחרוזת ריקה במשתנה מכבה רק את התבנית הזו. בלי TOKEN לא נשלח כלום.

**גוף התבנית:** ידוע ש-`{{1}}` הוא שם הלקוחה. `{{2}}…` עדיין לא ידועים. כרגע נשלח רק שם (`UTILITY_BODY_KEYS = ['name']` ב-`server/src/whatsapp/vars.ts`). אם Meta דוחה בגלל מספר פרמטרים — להוסיף לשם `orderId` / `total` / `timeOrAddress` (כבר מחושבים ב-`orderUtilitySlots`).

6. Webhook (להמשך, סטטוסי מסירה): כתובת `https://<שרת>/webhooks/whatsapp`, verify token = `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. בדיקת חתימה עדיין לא מיושמת.

ב-`.env`:

```
WHATSAPP_TOKEN="EAAG..."
WHATSAPP_PHONE_NUMBER_ID="1318024191397722"
WHATSAPP_WABA_ID="1753798195905322"
WHATSAPP_TEMPLATE_OTP="bite_otp"
WHATSAPP_TEMPLATE_ORDER_CONFIRMED_PICKUP="order_pickup_confirmed"
WHATSAPP_TEMPLATE_ORDER_CONFIRMED_DELIVERY="order_dely"
WHATSAPP_TEMPLATE_ORDER_READY_PICKUP="order_pick_up"
WHATSAPP_TEMPLATE_ORDER_DELIVERED="order_dalivery"
WHATSAPP_TEMPLATE_LANG="he"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="choose-a-long-random-string"
```

#### Railway Variables

במסך Variables של שירות ה-API (אין סודות בגיט):

| משתנה | ערך |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | `1318024191397722` |
| `WHATSAPP_WABA_ID` | `1753798195905322` |
| `WHATSAPP_TEMPLATE_ORDER_CONFIRMED_DELIVERY` | `order_dely` (גם ברירת המחדל בקוד) |
| `WHATSAPP_TOKEN` | Permanent token · מדביקים כאן בלבד |

מספר התצוגה של המספר המחובר: **+972 52-505-6708**.

#### מתי נשלח

- **OTP** — `POST /auth/otp/request` (וואטסאפ) וגם `POST /auth/forgot-password` כשיש טלפון בחשבון. קישור איפוס למייל נשלח בנפרד כשיש כתובת. תבנית Authentication עם copy-code (תבנית Meta עדיין חסרה). הקוד בן 6 ספרות, 10 דקות. `POST /auth/otp/verify` מחזיר סשן.
- **אישור הזמנה** — אחרי `POST /orders` (לקוחה, כולל שכפול) ואחרי `POST /admin/orders`. איסוף מול משלוח לפי `ship`.
- **מוכנה לאיסוף** — `PATCH /admin/orders/:id/status` ל-`מוכנה` (או `ready`) בהזמנת איסוף.
- **המשלוח הגיע** — אותו PATCH ל-`נמסרה` (או `delivered`) בהזמנת משלוח.

כישלון Meta **לא** מפיל הזמנה או איפוס סיסמה; נרשם ללוג.

מספרים ישראליים מנורמלים ל-`9725…` (בלי `+`).

#### הסכמה באפליקציה

יש שורת הסכמה ליד מסך הכניסה (`COPY.whatsappOptIn`). מסך הזנת קוד OTP עדיין לא מחובר ב-UI — הלקוח יכול לקרוא `requestOtp` / `verifyOtp` מ-`mobile/src/api/auth.ts`. כפתור ״שכחתי סיסמה״ כבר שולח קוד בוואטסאפ כשיש טלפון.

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

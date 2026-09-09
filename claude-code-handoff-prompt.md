# BITE & TELL · מסמך המשכיות

> עודכן: 9 בספטמבר 2026. הקובץ מתאר את המצב **הנוכחי** של הפרויקט.
> אם קראת אותו — יש לך את כל מה שצריך כדי להמשיך בלי שאלות פתיחה.

**העסק:** שקד לילוז · שף פרטית וקייטרינג · מותג **BITE & TELL**.
**Git:** `https://github.com/shakedgoren/ShakedLilosPrivetChef.git` · ענף `main`.
**תיקיית עבודה:** `/Users/shakedgoren/Downloads/files`

---

## כללי הברזל — לקרוא לפני כל פעולה

### 1 · לפני כל פרסום לקנבס

> כלל ברזל אחד: אני עורכת את העיצוב בקנבס ושומרת. לפני שאתה מפרסם משהו —
> תקרא את הארטיפקט עם `Artifact action:"read"`, תחלץ עם `seed-canvas.mjs --extract`
> לתיקייה ריקה, תשווה לקבצים המקומיים, ותאמץ את הגרסה שלי כבסיס. ואז תאמת
> ב-grep ובגודל הקובץ שהעריכות שלי שרדו את המיזוג. פרסום בלי זה דורס לי את
> העבודה, וזה כבר קרה פעם אחת.

### 2 · שלושה כללים קבועים

> 1. אסור לשנות טקסטים שאני כתבתי. אם אתה מוסיף טקסט חדש, תגיד לי במפורש שאתה כתבת אותו.
> 2. אל תוסיף אלמנטים או סעיפים שלא ביקשתי. תציע במקום.
> 3. בסוף כל משימה: `git add -A && git commit && git push origin main`

### 3 · קבצי `mobile/src/data/*.ts` נוצרים אוטומטית — אסור לערוך אותם ביד

כל שינוי בהם נמחק בהרצה הבאה של ה-emitter. **זה כבר קרה:** הרצה חוזרת של
`emit-admin-orders.mjs` מחקה תוספות שקורסור כתב לקובץ. תוספות שצד השרת צריך
נכנסות ל-`scripts/emit-*.mjs` עצמו, ושם הן מסומנות בהערה `⚠ לא מהקנבס`.

---

## שלוש השכבות של הפרויקט

| שכבה | מה זה | מצב |
|---|---|---|
| `chef-questionnaire.html` | הגרסה הראשונה · HTML יחיד | **ארכיון.** מקור אמת לטקסטים ומחירים בלבד |
| `design/app/` | קנבס העיצוב · 22 מסכים | **פעיל.** שקד עורכת שם ושומרת |
| `mobile/` | האפליקציה האמיתית · React Native | **22/22 המסכים הועברו** |
| `server/` | Express + Prisma · קורסור בנה | **חי.** 8 טבלאות, כל הראוטים |

---

## שכבה 2 · קנבס העיצוב

22 ארטבורדים ב-`design/app/*.dc.html` + `canvas.json` + 80 תמונות ב-`assets/`.

**הארטיפקט:** `https://claude.ai/code/artifact/1f045445-e886-46ce-b3b3-8082b95742a3`
**כותרת:** `BITE and TELL` (הסידר דוחה `&` בכותרת · המסכים משתמשים ב-`BITE &amp; TELL`)

### בנייה ופרסום

```bash
export SK=<נתיב הסקיל design>        # משתנה בין סשנים · מריצים /design כדי לקבלו
bash scripts/seed.sh                  # מריץ optimize-assets ואז סוֹרֵק את כל 22 המסכים וכל התמונות
```
ואז `Artifact` עם `url` של הארטיפקט, `contract: "0.1.31"`, `favicon: "👨🏻‍🍳"`, **בלי** `capabilities`.

### שרשרת האימות לפני כל פרסום

1. החלפת מחרוזת מדויקת עם `assert count == 1`
2. בדיקת איזון תגיות (`html.parser` עם מחסנית) על כל 22 המסכים
3. כל `{{ חור }}` מקבל ערך מ-`renderVals`
4. `node --check` על בלוק ה-JS של כל מסך
5. סימולציה ב-node של זרימות אמיתיות
6. grep + גודל קובץ על המטען הסרוק

**למה זה קיים:** פעם אחת חיתוך מרקאפ בלע את כל תוכן דף הבית לתוך `sc-if`
מוסתר והדף יצא ריק. `node --check` ובודק החורים עברו בהצלחה. רק בדיקת
איזון התגיות תופסת את זה.

### 22 המסכים

**לקוחה:** `App` (מעטפת ניווט) · `Guest` · `Main` · `Login` · `Order` (קוסקוס) ·
`Schnitzel` · `Boxes` (ספיישל) · `Fruit` · `Chef` · `MyOrders` · `Profile`
**ניהול:** `Admin` · `AdminOrders` · `AdminBoard` (אייפד 1180×820) · `AdminDays` ·
`AdminMoney` · `AdminShopping` · `AdminHistory` · `AdminStock` · `AdminCustomers` ·
`AdminMenu` · `AdminCosts`

### שפת העיצוב

- גופן Assistant · רקע `#FCFBFB` · טקסט `#2A2430`
- זהב המותג: `#8A6A1F → #D4AF37 → #C9A227` · טקסט זהב `#A9812A` · רך `#9C7F3F`
- חמישה גווני קטגוריה: קוסקוס `#7B5CBC` · שניצל `#416D9E` · ספיישל `#437C59` ·
  פירות `#B04A76` · שף `#A85A28`
- RTL · גרשיים עבריים `׳`/`״` במחרוזות JS · **אין מע״מ** (עוסק פטור)

---

## שכבה 3 · האפליקציה

`mobile/` · Expo SDK 57 + React Native 0.86 + TypeScript · קוד אחד לאייפון ולאנדרואיד.
`AGENTS.md` דורש לקרוא את התיעוד הממוספר של אקספו — `https://docs.expo.dev/versions/v57.0.0/` — לפני כתיבת קוד.

```bash
cd mobile && npx tsc --noEmit                    # בדיקת טיפוסים
npx expo export --platform ios --output-dir /tmp/x   # בדיקת bundle
```
**תצוגה חיה:** `.claude/launch.json` מגדיר `bite-and-tell` שמריץ `expo start --web`
על פורט 8081. משתמשים ב-`preview_start` ואז בודקים עם `javascript_tool`.
לבדיקה בדפדפן יש קישור עומק `?screen=<שם>` — **אני כתבתי אותו**, הוא לא קיים במכשיר.

### מבנה

```
src/theme/tokens.ts        אסימוני העיצוב · הועתקו אחד לאחד מהקנבס
src/theme/fonts.ts         שש משקולות Assistant + Anton · כל משקולת היא משפחה נפרדת
src/theme/applyFonts.tsx   מזריק את המשפחה לפי fontWeight לתוך כל <Text>
src/data/                  נתונים שנוצרו אוטומטית · אסור לערוך ביד
src/api/                   הלקוח מול השרת · client, auth, orders, admin, status, storage
src/navigation/store.tsx   מעטפת הניווט · מקבילה ל-App.dc.html
src/order/                 זרימת המסירה המשותפת לכל הקטגוריות
src/components/            רכיבים משותפים · Masthead, PhotoReel, Photo, Stepper
src/screens/               מסכי הלקוחה · 11
src/admin/                 מסכי הניהול · 11 + ערכת ui/ משותפת
```

### הגופנים — התיקון הוויזואלי הגדול ביותר

ב-React Native כל משקולת היא **משפחה נפרדת**; `fontWeight` לבדו לא בוחר קובץ.
`applyFonts.tsx` עוטף את `Text` ומזריק `fontFamily` לפי המשקולת **בכניסה** ל-render.
ניסיון לשכפל את האלמנט המוחזר עם מערך סגנונות נכשל בשקט על צמתי DOM.

### חילוץ נתונים מהקנבס — אל תקליד ידנית

יש כ-20 זוגות סקריפטים ב-`scripts/`:

```bash
node scripts/extract-<x>.mjs && node scripts/emit-<x>.mjs   # → mobile/src/data/<x>.ts
```
ה-extractor מושך מהמרקאפ עם `assert found exactly once` — כל כישלון כזה תפס עד היום
בעיה אמיתית (תגית כפולה עם ערכים שונים, רגקס שתפס סף שגוי, כותרת שמופיעה פעמיים).
**לעולם לא להקליד את הנתונים ביד.**

---

## שכבה 4 · השרת

`server/` · Express + Prisma. קורסור בנה אותו במקביל; שלוש התנגשויות מוזגו.

**8 טבלאות:** `User` · `PasswordReset` · `Order` · `SaleDay` · `SupplyItem` ·
`ShoppingList` · `ProductionDish` · `Expense`

**נקודות הקצה** (`server/src/app.ts`):

| בסיס | ראוטר | עיקר |
|---|---|---|
| `/auth` | `auth.ts` | `login` `register` `google` `forgot-password` `reset-password` `change-password` |
| `/users` | `users.ts` | `GET/PATCH /me` |
| `/orders` | `orders.ts` | `GET /` `POST /` `GET /:id` |
| `/admin` | `admin.ts` | `orders` `orders/:id` `orders/:id/status` `orders/:id/qty` `customers` `customers/:id` `history` `menu` `board` |
| `/admin/days` | `adminDays.ts` | `GET/PUT /:date` `GET/PUT /active` `POST /active/close` `PATCH /:date/waste` |
| `/admin/stock` | `adminStock.ts` | `GET/POST /supply` `PATCH/DELETE /supply/:id` |
| `/admin/shop` | `adminShop.ts` | `GET /` `POST /` `GET /:id` |
| `/admin` | `adminFinance.ts` | `money` `costs` `costs/:id` `costs/import/:listId` `summary` |

הכתובת באפליקציה: `EXPO_PUBLIC_API_URL` (`mobile/src/api/config.ts`). ריק = מצב דמה.

---

## התמונות

80 קבצים ב-`design/app/assets/`. **כולן `.jpg` פרט ל-`logo.png`.**
`sync-photos.sh` בוחר לכל שם את הגרסה עם יותר פיקסלים מבין `assets/` ל-`assets/originals/`,
ואז מקטין ליעדים שב-README. 31MB → 8.6MB.
`check-photos.mjs` גוזר את הקבוצות מ-`photos.ts` עצמו · **69 מתוך 80 בשימוש.**

- **3 תמונות חסרות** (שקד סימנה באדום): ממשותף לאישי · שולחן קינוחים מעוצב ·
  חבילת שתייה ללא הגבלה
- `Photo.tsx` נופל בחזרה למציין המקום המקווקו ״תמונה״ כשקובץ חסר

---

## שאלות פתוחות — מחכות להחלטה של שקד

1. **מע״מ:** `Admin` מציג ״לפני/כולל מע״מ״ אבל `AdminMoney` אומר עוסק פטור בלי פיצול מע״מ
2. **רווח חודשי:** 9,140 ב-`Admin` מול 19,660 ב-`AdminMoney`
3. **שלוש עלויות הסלטים ב-`AdminMenu`** (19.9/30.8/213.3) לא מסכימות עם `AdminCosts` (21.3/43.8/244.3) — זה פער בין קנבס לקנבס, לא באג בהעברה
4. **`home-1..10` לא בשימוש** — רצועת התמונות בקנבס משתמשת בחמש תמונות הקטגוריות. איפה התמונות האלה אמורות לשבת?
5. **קרוסלת השף:** 14 תמונות → 14 נקודות; בקנבס יש 3
6. **״שולם בפועל״ ב-`AdminShopping`** — האם צריך להיות ניתן לעריכה? בקנבס אין ממשק עריכה
7. **שורת הסיכומים ב-`AdminBoard`** — בקנבס היא מוסטת ב-114px. יישרתי אותה בהעברה. להשאיר או להתאים לפגם?

---

## מה עוד אין

- **סליקה · וואטסאפ** — תהליכי אישור של שבועות. **על שקד להתחיל אותם עכשיו.**
- **3 התמונות החסרות**
- **כל הנתונים ב-`mobile/src/data/admin*.ts` הם דמה** — הגיעו מהקנבס, לא מהשרת
- **בדיקות** — אין

---

## איך לעבוד מול שקד

- עברית, ישיר, בלי להתנצל.
- **לאמת, לא להניח.** למדוד בדפדפן ולהראות מספרים.
- כשמשהו נשבר — להגיד מה, למה, ואיך תוקן.
- כשמשהו לא נבדק — להגיד את זה במפורש.
- להציע במקום להוסיף מיוזמתי.

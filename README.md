# BITE & TELL

שקד לילוז · שף פרטית וקייטרינג.

| תיקייה | מה |
|---|---|
| `mobile/` | אפליקציית Expo (לקוחה + מסכי ניהול) |
| `server/` | API · חשבונות והזמנות שנשמרים |
| `design/app/` | קנבס העיצוב · לא לגעת בלי צורך |

## שרת מקומי

ההוראות המלאות ב-[server/README.md](server/README.md) — כולל **SQLite מול Postgres מקומי** (Docker Compose, בלי ענן) וחיבור **WhatsApp Cloud API** (אופציונלי).

מספר וואטסאפ מחובר: **+972 52-505-6708** · `WHATSAPP_PHONE_NUMBER_ID=1318024191397722` · `WHATSAPP_WABA_ID=1753798195905322`. שליחה חיה עדיין חסומה: אמצעי תשלום ב-Meta ואימות עסקי. התבניות, כולל `order_dely`, מאושרות על ה-WABA הזה. הטוקן לא נכנס לגיט.

```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

```bash
cd mobile
cp .env.example .env
npx expo start --web
```

בלי `EXPO_PUBLIC_API_URL` האפליקציה נשארת במצב דמה (התחברות בלי שרת).

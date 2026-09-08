# BITE & TELL

שקד לילוז · שף פרטית וקייטרינג.

| תיקייה | מה |
|---|---|
| `mobile/` | אפליקציית Expo (לקוחה + מסכי ניהול) |
| `server/` | API · חשבונות והזמנות שנשמרים |
| `design/app/` | קנבס העיצוב · לא לגעת בלי צורך |

## שרת מקומי

ההוראות המלאות ב-[server/README.md](server/README.md).

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

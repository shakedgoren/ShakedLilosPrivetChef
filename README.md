# BITE & TELL

שקד לילוז · שף פרטית וקייטרינג.

| תיקייה | מה |
|---|---|
| `mobile/` | אפליקציית Expo (לקוחה + מסכי ניהול) |
| `server/` | API · חשבונות והזמנות שנשמרים |
| `design/app/` | קנבס העיצוב · לא לגעת בלי צורך |

## שרת מקומי

ההוראות המלאות ב-[server/README.md](server/README.md) — כולל **SQLite מול Postgres מקומי** (Docker Compose, בלי ענן) וחיבור **WhatsApp Cloud API** (אופציונלי).

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

## Deploy on Railway

פרודקשן: **Railway + Postgres**. אין סודות בגיט — שקד מדביקה אותם ב-Variables.

פירוט מלא, רשימת משתנים ו-healthcheck: [server/README.md](server/README.md#deploy-on-railway).

**צ׳קליסט**

1. חשבון ב-[railway.app](https://railway.app) (Hobby — כרטיס אשראי אצל Railway, לא סליקה באפליקציה).
2. **New Project** → **Empty Project**.
3. **Add Postgres** (Database → PostgreSQL) לאותו פרויקט.
4. **New Service** → GitHub → `shakedgoren/ShakedLilosPrivetChef` → ענף `main` אחרי המיזוג.
5. Root Directory **ריק** (שורש הריפו). לא `server/` — ה-Dockerfile מעתיק גם `mobile/src/data`.
6. Variables — ראו את הרשימה בשרת README. חובה: `DATABASE_URL` (מה-Postgres), `JWT_SECRET`, `NODE_ENV=production`.
7. Deploy. אחרי עלייה: `GET https://<כתובת>/health` → `{ "ok": true, "service": "bite-and-tell", ... }`.
8. פעם אחת: זריעת מנהלת (`db:seed:admin`) — לא `db:seed` המלא (נתוני דמה).

אין דיפלוי אוטומטי מ-CI עם טוקן Railway בגיט. אחרי חיבור הריפו, Railway בונה מ-`server/Dockerfile`.

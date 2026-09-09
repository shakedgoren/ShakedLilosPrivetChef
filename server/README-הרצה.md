# הרצת השרת מקומית

```bash
cd server
cp .env.example .env          # פעם אחת
npm install
npx prisma migrate deploy     # יוצר את server/prisma/dev.db
npm run db:seed               # חשבון מנהלת + נתוני פתיחה
npm run dev                   # http://localhost:3001
```

ואז באפליקציה — `mobile/.env` (לא נכנס ל-git):

```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

בלי המשתנה האפליקציה נשארת על נתוני הדמה.
**במכשיר אמיתי** צריך את כתובת הרשת של המחשב, לא `localhost`.

## ההתחברות

השדה בבקשה נקרא `who` — טלפון או אימייל, לא `email`.
פרטי המנהלת מ-`.env`: טלפון `0500000000`, סיסמה `changeme`.

## בדיקות

```bash
npm test      # 7 בדיקות · תמחור ושבוע מכירה
npm run smoke
```

## נקודות הקצה שהאפליקציה קוראת

| מסך | נקודת קצה |
|---|---|
| Admin | `/admin/summary` |
| AdminOrders | `/admin/orders` · `/admin/customers` |
| AdminBoard | `/admin/board?date=&category=` |
| AdminDays | `/admin/days?from=&to=` |
| AdminMoney | `/admin/money?period=` |
| AdminShopping | `/admin/shop/active` |
| AdminHistory | `/admin/shop/history` |
| AdminStock | `/admin/stock/sale` · `/admin/stock/supply` |
| AdminCustomers | `/admin/customers` |
| AdminMenu | `/admin/menu` |
| AdminCosts | `/admin/costs` |

⚠ טבלת נקודות הקצה שבמסמך ההמשכיות שגויה בשני מקומות:
אין `/admin/history` ואין `/admin/days/active` — היסטוריית הקניות
וסגירת הרשימה יושבות תחת `/admin/shop`.

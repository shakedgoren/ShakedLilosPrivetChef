import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { env } from './env.ts';
import { mailConfigured } from './mail/mailer.ts';
import { HttpError } from './errors.ts';
import { apiLimiter, authLimiter } from './http/rateLimit.ts';
import { authRouter } from './routes/auth.ts';
import { usersRouter } from './routes/users.ts';
import { ordersRouter } from './routes/orders.ts';
import { adminRouter } from './routes/admin.ts';
import { adminDaysRouter } from './routes/adminDays.ts';
import { adminStockRouter } from './routes/adminStock.ts';
import { adminShopRouter } from './routes/adminShop.ts';
import { adminFinanceRouter } from './routes/adminFinance.ts';
import { whatsappWebhookRouter } from './routes/whatsappWebhook.ts';

export function createApp() {
  const app = express();
  /**
   * ⚠ **כתובת אמיתית מאחורי פרוקסי** · בלי זה כל הבקשות נראות
   * כמגיעות מאותה כתובת והגבלת הקצב חוסמת את כולן יחד.
   * ⚠ מופעל רק כשמוגדר במפורש · `trust proxy` פתוח לרווחה מאפשר
   * לזייף כתובת דרך `X-Forwarded-For`.
   */
  if (env.trustProxy) app.set('trust proxy', env.trustProxy);

  /**
   * כותרות אבטחה.
   *
   * ⚠ **בלי CSP** · זה API שמחזיר JSON, ומדיניות תוכן שייכת לדף
   * שמציג אותו ולא לשרת שמגיש אותו. CSP כאן רק היה שובר את
   * `/uploads`.
   *
   * ⚠ **`crossOriginResourcePolicy: cross-origin`** · תמונות
   * הפרופיל מוגשות מ-`/uploads` ונטענות מכתובת אחרת. ברירת
   * המחדל של helmet היא `same-origin`, והיא הייתה חוסמת אותן.
   */
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  /**
   * ⚠ **CORS מצומצם · 19 בספטמבר 2026** · קודם עמד כאן
   * `origin: true`, כלומר **כל אתר בעולם** יכול היה לקרוא ל-API
   * מהדפדפן של מישהי מחוברת.
   *
   * ⚠ **בקשה בלי `Origin` עוברת תמיד** · האפליקציה הנייטיבית
   * אינה שולחת את הכותרת הזו ואינה כפופה ל-CORS. חסימה שלה כאן
   * הייתה שוברת את האפליקציה בלי להוסיף שום הגנה.
   *
   * ⚠ **בפיתוח הכול פתוח** · אחרת Expo Web ובדיקות מהרשת
   * המקומית מפסיקים לעבוד. בפרודקשן צריך `CORS_ORIGINS`.
   */
  const allow = new Set(env.corsOrigins);
  app.use(
    cors({
      origin(origin, done) {
        if (!origin) return done(null, true);
        if (env.node !== 'production' && allow.size === 0) return done(null, true);
        done(null, allow.has(origin));
      },
    }),
  );

  app.use(express.json({ limit: '4mb' }));
  app.use('/uploads', express.static(env.uploadDir));

  /**
   * ⚠ **מה בדיוק רץ עכשיו · 23 בספטמבר 2026** · בלי זה אי אפשר
   * לדעת מבחוץ אם פריסה תפסה. `RENDER_GIT_COMMIT` מוזרק על ידי
   * Render לכל פריסה. השדות האחרים מדווחים אם משתנה סביבה הגיע
   * בפועל לשרת — **בלי לחשוף את הערך עצמו**, רק אם הוא קיים.
   */
  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'bite-and-tell',
      commit: (process.env.RENDER_GIT_COMMIT ?? '').slice(0, 7) || null,
      whatsapp: env.whatsapp.enabled,
      cors: env.corsOrigins.length,
      google: Boolean(env.googleClientId),
      // אותה בדיקה בדיוק שהמיילר עצמו עושה · ארבעה שדות, לא שניים
      mail: mailConfigured(),
    });
  });

  app.use('/webhooks/whatsapp', whatsappWebhookRouter);
  /* ⚠ הגבלת קצב · ראו `http/rateLimit` · הרגישה לפני הכללית */
  app.use('/auth', authLimiter);
  app.use(apiLimiter);
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/orders', ordersRouter);
  app.use('/admin', adminRouter);
  app.use('/admin/days', adminDaysRouter);
  app.use('/admin/stock', adminStockRouter);
  app.use('/admin/shop', adminShopRouter);
  app.use('/admin', adminFinanceRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'invalid_body', details: err.flatten() });
      return;
    }
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.code, message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  });

  return app;
}

import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { env } from './env.ts';
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
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '4mb' }));
  app.use('/uploads', express.static(env.uploadDir));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'bite-and-tell', whatsapp: env.whatsapp.enabled });
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

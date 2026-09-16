import { Router } from 'express';
import { publicPayConfig } from '../orders/payment.ts';

/**
 * הגדרות תשלום ללקוחה · קישורי ביט/פייבוקס ומספרים.
 * בלי הזדהות — אין כאן סודות, רק כתובות שהלקוחה צריכה כדי לשלם.
 */
export const paymentsRouter = Router();

paymentsRouter.get('/', (_req, res) => {
  res.json(publicPayConfig());
});

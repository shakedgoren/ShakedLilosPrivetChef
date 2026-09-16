import { Router } from 'express';
import { env } from '../env.ts';
import { verifyWebhookChallenge } from '../whatsapp/webhook.ts';

/**
 * Webhook של Meta · אימות token ב-GET, קבלת סטטוסי מסירה ב-POST.
 * בדיקת חתימה (X-Hub-Signature-256) תתווסף בהמשך.
 */
export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.get('/', (req, res) => {
  const result = verifyWebhookChallenge(req.query as Record<string, unknown>, env.whatsapp.webhookVerifyToken);
  if (result.status === 200) {
    res.status(200).send(result.body);
    return;
  }
  res.status(result.status).json({ error: result.error });
});

whatsappWebhookRouter.post('/', (_req, res) => {
  /* קבלה בלבד · פיענוח סטטוסים (delivered / read / failed) יתווסף אחר כך */
  res.status(200).json({ ok: true });
});

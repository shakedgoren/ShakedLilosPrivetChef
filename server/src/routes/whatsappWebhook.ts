import { Router } from 'express';
import { env } from '../env.ts';
import { authorizeWebhook, noteWebhook, readWebhook } from '../whatsapp/webhook.ts';

/**
 * וובהוק Green API · `POST` בלבד.
 *
 * ⚠ **אין יותר `GET`** · הוא שימש לאימות של Meta
 * (`hub.challenge`), ול-Green API אין טקס כזה.
 *
 * ⚠ **תמיד 200 למה שאומת** · ספק שמקבל שגיאה חוזר שוב ושוב. מה
 * שלא מעניין אותנו נבלע בשקט, וכישלון אמיתי נרשם ל-`lastError`
 * ונקרא מ-`GET /admin/whatsapp`.
 */
export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.post('/', (req, res) => {
  const auth = authorizeWebhook(
    typeof req.headers.authorization === 'string' ? req.headers.authorization : '',
    env.whatsapp.webhookToken,
  );
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  noteWebhook(readWebhook(req.body));
  res.status(200).json({ ok: true });
});

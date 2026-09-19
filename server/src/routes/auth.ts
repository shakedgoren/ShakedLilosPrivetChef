import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { env } from '../env.ts';
import { badGateway, badRequest, unauthorized } from '../errors.ts';
import { parseWho, publicUser } from '../auth/identity.ts';
import { signupEmail } from '../auth/signupEmail.ts';
import { signToken } from '../auth/jwt.ts';
import { requireAuth } from '../auth/middleware.ts';
import { hashPassword, verifyPassword } from '../auth/passwords.ts';
import { upsertGoogleUser, verifyGoogleIdToken } from '../auth/google.ts';
import { buildResetEmail } from '../mail/resetEmail.ts';
import { checkResetCode, newResetCode, RESET_CODE_TTL_MS } from '../auth/resetCode.ts';
import { sendMail } from '../mail/mailer.ts';
import { consumeOtp, generateOtp, issuePasswordReset, OTP_TTL_MS } from '../whatsapp/otp.ts';
import { notifyOtp } from '../whatsapp/notify.ts';
import {
  canSend,
  checkCode,
  MAX_ATTEMPTS,
  verifiedRecently,
  VERIFY_TTL_MS,
} from '../auth/phoneVerify.ts';

export const authRouter = Router();

/**
 * ⚠ **המייל והמגדר נשמרים בהרשמה עצמה · 19 בספטמבר 2026** · שקד
 * דיווחה: ״ביצירת משתמש חדש, זה לא שומר את האימייל ואת המגדר
 * שסימנתי בדף ההרשמה״.
 *
 * הם נשלחו עד היום בקריאה **שנייה** ל-`PATCH /users/me` מיד אחרי
 * ההרשמה, והיא נעטפה ב-`catch` ריק במסך — כלומר כל כישלון שלה היה
 * בלתי נראה. עכשיו הם חלק מאותה בקשה: או שהחשבון נוצר עם הכול, או
 * שהוא לא נוצר.
 */
const whoBody = z.object({
  who: z.string().min(3),
  password: z.string().min(6),
  name: z.string().optional(),
  email: z.union([z.string().max(80), z.null()]).optional(),
  gender: z.enum(['female', 'male', 'other', '']).optional(),
});

const sessionOf = (user: { id: string; role: string }) => ({
  token: signToken({ sub: user.id, role: user.role }),
  user: publicUser(user as Parameters<typeof publicUser>[0]),
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = whoBody.parse(req.body);
    const who = parseWho(body.who);
    if (!who) throw badRequest('invalid_who');

    const existing =
      who.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: who.email } })
        : await prisma.user.findUnique({ where: { phone: who.phone } });
    if (existing) throw badRequest(who.kind === 'email' ? 'email_taken' : 'phone_taken');

    /**
     * ⚠ **הרשמה בטלפון דורשת אימות טרי** · בלי זה כל אחד יכול לפתוח
     * חשבון על מספר שאינו שלו, והשלב שקדם לו היה קישוט בלבד.
     *
     * ⚠ הרשמה באימייל אינה נבדקת כאן · היא משמשת את הזריעה ואת חשבון
     * הניהול. האפליקציה נרשמת בטלפון בלבד.
     */
    let verifiedPhone: string | null = null;
    if (who.kind === 'phone') {
      const row = await prisma.phoneVerification.findUnique({ where: { phone: who.phone } });
      if (!verifiedRecently(row, Date.now())) {
        throw badRequest('phone_unverified', 'צריך לאמת את הטלפון קודם');
      }
      verifiedPhone = who.phone;
    }

    /* ⚠ המייל שיישמר · ראו `signupEmail` */
    const typedMail = who.kind === 'phone' ? body.email ?? null : null;
    const taken = typedMail ? !!(await prisma.user.findUnique({ where: { email: typedMail.trim() } })) : false;

    const user = await prisma.user.create({
      data: {
        email: signupEmail(who, typedMail, taken),
        phone: who.kind === 'phone' ? who.phone : null,
        passwordHash: await hashPassword(body.password),
        name: body.name?.trim() ?? '',
        gender: body.gender ?? '',
        role: 'customer',
      },
    });
    /* האימות נוצל · לא ניתן לפתוח איתו חשבון שני */
    if (verifiedPhone) {
      await prisma.phoneVerification.update({
        where: { phone: verifiedPhone },
        data: { usedAt: new Date() },
      });
    }

    res.status(201).json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

/**
 * ─────────── אימות טלפון לפני הרשמה ───────────
 *
 * ⚠ **לא `/auth/otp/*`** · אלה מחפשים משתמש קיים, ובהרשמה עדיין
 * אין כזה. הקודים כאן מוצמדים למספר הטלפון, ראו `auth/phoneVerify.ts`.
 *
 * ⚠ **כאן כן מגלים שהמספר תפוס** · בניגוד לאיפוס סיסמה. מי שנרשמת
 * חייבת לדעת שכבר יש לה חשבון, אחרת היא תנסה שוב ושוב בלי להבין.
 */
authRouter.post('/register/phone', async (req, res, next) => {
  try {
    const body = z.object({ phone: z.string().min(3) }).parse(req.body);
    const who = parseWho(body.phone);
    if (!who || who.kind !== 'phone') throw badRequest('invalid_phone', 'מספר טלפון לא תקין');
    const phone = who.phone;

    const taken = await prisma.user.findUnique({ where: { phone } });
    if (taken) throw badRequest('phone_taken', 'כבר יש חשבון עם המספר הזה');

    const now = Date.now();
    const existing = await prisma.phoneVerification.findUnique({ where: { phone } });
    const gate = canSend(existing, now);
    if (!gate.ok) {
      throw badRequest('too_soon', `אפשר לשלוח שוב בעוד ${Math.ceil(gate.waitMs / 1000)} שניות`);
    }

    const code = generateOtp();
    const data = {
      code,
      sentAt: new Date(now),
      expiresAt: new Date(now + VERIFY_TTL_MS),
      attempts: 0,
      verifiedAt: null,
      usedAt: null,
    };
    await prisma.phoneVerification.upsert({ where: { phone }, create: { phone, ...data }, update: data });

    /* ⚠ הקוד לעולם לא ביומן · רק ב-RESET_DEBUG, לפיתוח */
    try {
      await notifyOtp(phone, code);
    } catch (err) {
      console.error('[אימות טלפון] שליחת וואטסאפ נכשלה', err);
    }

    res.json(env.resetDebug ? { ok: true, code } : { ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register/verify', async (req, res, next) => {
  try {
    const body = z.object({ phone: z.string().min(3), code: z.string().min(4).max(8) }).parse(req.body);
    const who = parseWho(body.phone);
    if (!who || who.kind !== 'phone') throw badRequest('invalid_phone', 'מספר טלפון לא תקין');
    const phone = who.phone;

    const row = await prisma.phoneVerification.findUnique({ where: { phone } });
    const verdict = checkCode(row, body.code, Date.now());

    if (verdict === 'ok') {
      await prisma.phoneVerification.update({
        where: { phone },
        data: { verifiedAt: new Date(), attempts: 0 },
      });
      res.json({ ok: true });
      return;
    }

    /* ⚠ כל ניסיון שגוי נספר · חמישה נועלים את הקוד */
    if (verdict === 'wrong' && row) {
      await prisma.phoneVerification.update({
        where: { phone },
        data: { attempts: row.attempts + 1 },
      });
      const left = MAX_ATTEMPTS - (row.attempts + 1);
      throw badRequest('otp_invalid', left > 0 ? `הקוד לא נכון · נשארו ${left} ניסיונות` : 'הקוד ננעל');
    }
    if (verdict === 'expired') throw badRequest('otp_expired', 'הקוד פג · אפשר לשלוח חדש');
    if (verdict === 'locked') throw badRequest('otp_locked', 'הקוד ננעל · אפשר לשלוח חדש');
    throw badRequest('otp_invalid', 'הקוד לא תקין או שפג תוקפו');
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = whoBody.pick({ who: true, password: true }).parse(req.body);
    const who = parseWho(body.who);
    if (!who) throw unauthorized('invalid_credentials');

    const user =
      who.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: who.email } })
        : await prisma.user.findUnique({ where: { phone: who.phone } });
    if (!user?.passwordHash) throw unauthorized('invalid_credentials');
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw unauthorized('invalid_credentials');

    res.json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

/**
 * קוד פנוי · העמודה ייחודית במסד, ושש ספרות הן מיליון אפשרויות.
 * התנגשות היא נדירה, אבל ״נדיר״ אינו ״לא קורה״ — ולכן מנסים שוב.
 * ⚠ אחרי חמישה ניסיונות עדיף להיכשל מלהיתקע בלולאה.
 */
async function freshCode(): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    const code = newResetCode();
    const taken = await prisma.passwordReset.findUnique({ where: { token: code } });
    if (!taken) return code;
  }
  throw new Error('reset code collision');
}

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const body = z.object({ who: z.string().min(3) }).parse(req.body);
    const who = parseWho(body.who);
    const payload: { ok: true; resetToken?: string; expiresAt?: string; via?: 'otp' | 'token' } = { ok: true };

    if (who) {
      const user =
        who.kind === 'email'
          ? await prisma.user.findUnique({ where: { email: who.email } })
          : await prisma.user.findUnique({ where: { phone: who.phone } });
      if (user) {
        /**
         * ⚠ **קוד בן שש ספרות · 19 בספטמבר 2026** · ראו
         * `auth/resetCode.ts`. קודם נוצר כאן אסימון של 48 תווים
         * שנועד לקישור — וקישור כבר אין.
         *
         * ⚠ **הקודים הישנים של אותה לקוחה נמחקים** · ״לא קיבלתי,
         * תשלחי שוב״ לא אמור להשאיר חמישה קודים תקפים במקביל,
         * והטבלה לא אמורה לתפוח.
         */
        await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });
        const token = await freshCode();
        const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);
        await prisma.passwordReset.create({
          data: { userId: user.id, token, expiresAt },
        });

        /**
         * ⚠ **ערוץ אחד בלבד** · החלטה של שקד (16 בספטמבר 2026):
         * ״שיישלח קישור לאיפוס למייל״.
         *
         * ⚠ **מה שהיה שבור כאן** · במיזוג של ענף הוואטסאפ נוסף בלוק
         * OTP **מעל** בלוק המייל, ולכן בקשת איפוס אחת שלחה גם קישור
         * למייל וגם קוד בוואטסאפ — שני קודים שונים בשני ערוצים,
         * ושתי שורות ב-passwordReset לאותה בקשה. הלקוחה לא יכלה
         * לדעת באיזה מהם להשתמש.
         *
         * לוואטסאפ יש כבר נתיב ייעודי משלו, `POST /auth/otp/request`,
         * ולכן כאן נשאר המייל. חשבון בלי כתובת מייל נופל בחזרה
         * לוואטסאפ, אחרת אין לו שום דרך לאפס.
         */
        let via: 'otp' | 'token' = 'token';
        if (user.email) {
          const mail = buildResetEmail({ name: user.name, code: token });
          /* ⚠ לא `res` · זה שם התשובה של אקספרס, והצללה כאן מסוכנת */
          const sent = await sendMail({ to: user.email, ...mail });
          /**
           * ⚠ **כישלון שליחה נאמר בקול · 19 בספטמבר 2026** · שקד
           * דיווחה: ״באיפוס סיסמה במייל הוא לא באמת שולח שום הודעת
           * איפוס למייל, רק מציג התראה ששלח״. וכך זה באמת היה —
           * הכישלון נרשם ביומן בלבד, והלקוחה קיבלה ״נשלח״.
           *
           * ⚠ **זה אינו מסגיר האם יש חשבון** · כתובת שאין מאחוריה
           * חשבון כלל אינה מגיעה לכאן, ולכן היא תמשיך לקבל בדיוק
           * את אותה תשובה חיובית. מה שנאמר כאן הוא רק שהשרת עצמו
           * לא הצליח לשלוח — תקלה שלנו, ולא מידע עליה.
           */
          if (!sent.sent) {
            console.warn(`[איפוס] המייל לא יצא · ${sent.reason}`);
            throw badGateway('mail_failed');
          }
        } else if (user.phone) {
          const otp = generateOtp();
          await prisma.passwordReset.create({
            data: { userId: user.id, token: otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
          });
          try {
            await notifyOtp(user.phone, otp);
          } catch (err) {
            console.error('whatsapp otp failed', err);
          }
          via = 'otp';
        } else {
          console.warn(`[איפוס] למשתמש ${user.id} אין מייל ואין טלפון · לא נשלח דבר`);
        }

        if (env.resetDebug) {
          payload.resetToken = token;
          payload.expiresAt = expiresAt.toISOString();
          payload.via = via;
        }
      }
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    /**
     * ⚠ **מי · קוד · סיסמה · 19 בספטמבר 2026** · קודם הגיע לכאן
     * אסימון לבדו. קוד בן שש ספרות לבדו היה פרצה: מי שמנחש קוד
     * כלשהו היה מאפס את הסיסמה של **מישהו**, בלי לדעת של מי.
     * עכשיו צריך גם את החשבון, וגם חמישה ניסיונות סוגרים אותו.
     */
    const body = z
      .object({
        who: z.string().min(3),
        code: z.string().min(4).max(10),
        password: z.string().min(6),
      })
      .parse(req.body);

    const who = parseWho(body.who);
    if (!who) throw badRequest('invalid_who');
    const user =
      who.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: who.email } })
        : await prisma.user.findUnique({ where: { phone: who.phone } });

    const row = user
      ? await prisma.passwordReset.findFirst({
          where: { userId: user.id, usedAt: null },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    const verdict = checkResetCode(row, body.code, Date.now());
    if (verdict === 'wrong') {
      /* ⚠ המונה עולה גם כשהקוד שגוי · זה מה שסוגר את הסריקה */
      await prisma.passwordReset.update({
        where: { id: row!.id },
        data: { attempts: { increment: 1 } },
      });
      throw badRequest('reset_wrong');
    }
    if (verdict === 'expired') throw badRequest('reset_expired');
    if (verdict === 'locked') throw badRequest('reset_locked');
    if (verdict !== 'ok' || !row || !user) throw badRequest('reset_invalid');

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(body.password) },
      }),
      prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * קוד חד-פעמי בוואטסאפ (תבנית Authentication).
 * תמיד `{ ok: true }` כדי לא לחשוף אם יש חשבון.
 * עם `RESET_DEBUG=1` מוחזר גם `code` כשיש טלפון בחשבון.
 */
authRouter.post('/otp/request', async (req, res, next) => {
  try {
    const body = z.object({ who: z.string().min(3) }).parse(req.body);
    const who = parseWho(body.who);
    const payload: { ok: true; code?: string; expiresAt?: string } = { ok: true };

    if (who) {
      const user =
        who.kind === 'email'
          ? await prisma.user.findUnique({ where: { email: who.email } })
          : await prisma.user.findUnique({ where: { phone: who.phone } });
      if (user?.phone) {
        const issued = await issuePasswordReset({ userId: user.id, phone: user.phone });
        if (env.resetDebug) {
          payload.code = issued.token;
          payload.expiresAt = issued.expiresAt.toISOString();
        }
      }
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/otp/verify', async (req, res, next) => {
  try {
    const body = z.object({ who: z.string().min(3), code: z.string().min(4).max(16) }).parse(req.body);
    const who = parseWho(body.who);
    if (!who) throw badRequest('otp_invalid', 'הקוד לא תקין או שפג תוקפו');

    const user =
      who.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: who.email } })
        : await prisma.user.findUnique({ where: { phone: who.phone } });
    if (!user) throw badRequest('otp_invalid', 'הקוד לא תקין או שפג תוקפו');

    const row = await consumeOtp(user.id, body.code);
    if (!row) throw badRequest('otp_invalid', 'הקוד לא תקין או שפג תוקפו');

    res.json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/google', async (req, res, next) => {
  try {
    const audiences = env.googleClientIds;
    if (!audiences.length) {
      res.status(501).json({ error: 'google_not_configured' });
      return;
    }
    const body = z.object({ idToken: z.string().min(1) }).safeParse(req.body);
    if (!body.success) throw badRequest('google_token_required', 'חסר idToken מגוגל');

    const profile = await verifyGoogleIdToken(body.data.idToken, audiences);
    const user = await upsertGoogleUser(profile);
    res.json(sessionOf(user));
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        current: z.string().min(1),
        next: z.string().min(8),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.passwordHash) throw unauthorized('invalid_credentials');
    const ok = await verifyPassword(body.current, user.passwordHash);
    if (!ok) throw unauthorized('invalid_credentials');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.next) },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

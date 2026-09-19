import { Router } from 'express';
import { isExpoToken } from '../push/expo.ts';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { optionalAuth, requireAuth } from '../auth/middleware.ts';
import { badRequest, forbidden, notFound } from '../errors.ts';
import {
  assertFulfillment,
  assertQuote,
  isCategory,
  isQuoteCategory,
  quoteCustomer,
  type CustomerDetails,
} from '../catalog/quote.ts';
import { detailsSchema, parseCustomerDetails } from '../orders/details.ts';
import {
  assertCustomerOrderDay,
  evaluateCustomerSaleDay,
  loadSaleDayView,
  soldOutDishes,
  saleDayState,
  resolveCustomerSaleDate,
} from '../orders/saleDay.ts';
import { isoDate } from '../admin/sold.ts';
import { serializeOrder } from '../orders/serialize.ts';
import { readJson } from '../json.ts';
import { deliveryFee } from '../../../mobile/src/data/shared.ts';
import { notifyLater, notifyOrderConfirmed } from '../whatsapp/notify.ts';
import { saleWindow } from '../../../mobile/src/data/saleWeek.ts';
import { readPage } from '../http/page.ts';

export const ordersRouter = Router();

/**
 * ⚠ `ship`, `time` ו-`pay` אינם חובה יותר · בקשת הצעה לשף ולטאבון
 * מגיעה בלעדיהם, והאימות שלה הוא על פרטי האירוע (`assertQuote`).
 * לכל שאר הקטגוריות הם עדיין נדרשים — נבדק ב-`placeCustomerOrder`.
 */
const createSchema = z.object({
  ship: z.enum(['self', 'deliv']).optional(),
  time: z.string().min(4).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  pay: z.string().min(1).optional(),
  saleDate: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  details: detailsSchema,
});

const reorderSchema = z.object({
  ship: z.enum(['self', 'deliv']).optional(),
  time: z.string().min(4).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  pay: z.string().min(1).optional(),
  saleDate: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * בקשת הצעה · אין בה מסירה, שעה ותשלום, ולכן הן נגזרות מפרטי האירוע:
 * השף מגיע אל הלקוחה (`deliv`), ״השעה״ היא חלק היום שנבחר בשאלון,
 * והכתובת היא זו שנכתבה בטופס. אין תשלום באפליקציה — המקדמה מתואמת
 * בשיחה, ולכן `pay` נשאר ריק.
 * ⚠ **המיפוי הזה אינו מהקנבס** · הקנבס לא מגדיר מה נשמר בשרת.
 */
const quoteFulfillment = (picks: Record<string, unknown>) => ({
  ship: 'deliv' as const,
  time: String(picks.daypart ?? ''),
  city: '',
  address: String(picks.addr ?? ''),
  pay: '',
});

async function placeCustomerOrder(opts: {
  userId: string | null;
  userName: string;
  userPhone: string;
  ship?: 'self' | 'deliv';
  time?: string;
  city?: string;
  address?: string;
  pay?: string;
  saleDate?: string;
  name?: string;
  phone?: string;
  details: CustomerDetails;
}) {
  const category = opts.details.category;
  if (!isCategory(category)) throw badRequest('invalid_order', 'category');

  const quote = quoteCustomer(opts.details);

  let ship: 'self' | 'deliv';
  let time: string;
  let city: string | undefined;
  let address: string | undefined;
  let pay: string;

  if (isQuoteCategory(category)) {
    const picks = (opts.details as { picks: Record<string, unknown> }).picks;
    assertQuote(picks);
    ({ ship, time, city, address, pay } = quoteFulfillment(picks));
  } else {
    if (!opts.ship) throw badRequest('invalid_order', 'ship');
    if (!opts.time) throw badRequest('invalid_order', 'time');
    if (!opts.pay) throw badRequest('invalid_order', 'pay');
    ship = opts.ship;
    time = opts.time;
    city = opts.city;
    address = opts.address;
    pay = opts.pay;
    assertFulfillment(category, quote.meals, { ship, time, city, address, pay });
  }

  /**
   * דמי משלוח · 20 בתוך יבנה, 60 מחוצה לה. נמסר על ידי שקד
   * ב-15 בספטמבר 2026.
   * ⚠ **היה 0 בכל הזמנת לקוחה** · הסכום חושב רק בהזמנות הידניות
   * של מסך הניהול, ולכן לקוחה במשלוח שילמה כמו באיסוף.
   * ⚠ בקשת הצעה (שף וטאבון) פטורה · אין שם משלוח אלא הגעה של השף,
   * והמחיר מתואם בשיחה.
   */
  const shippingFee = isQuoteCategory(category) ? 0 : deliveryFee(ship, city ?? '');

  const name = (opts.name ?? opts.userName ?? '').trim();
  const phone = (opts.phone ?? opts.userPhone ?? '').trim();

  return prisma.$transaction(async (tx) => {
    const saleDate = await assertCustomerOrderDay(tx, {
      requested: opts.saleDate,
      category,
      details: opts.details,
    });
    return tx.order.create({
      data: {
        userId: opts.userId,
        category,
        status: 'חדשה',
        name,
        phone,
        ship,
        time,
        city: ship === 'deliv' ? (city ?? '') : '',
        address: ship === 'deliv' ? (address ?? '').trim() : '',
        pay,
        saleDate,
        via: '',
        itemsJson: JSON.stringify(quote.lines),
        detailsJson: JSON.stringify(opts.details),
        itemsTotal: quote.itemsTotal,
        shippingFee,
        total: quote.total + shippingFee,
      },
    });
  });
}

/**
 * האם יום המכירה של הקטגוריה פתוח להזמנה.
 *
 * ⚠ נוסף בשביל ״להזמין שוב״ · שקד ביקשה שהכפתור **יבדוק קודם**
 * אם היום פתוח, במקום לשלוח הזמנה כפולה מיד.
 * קטגוריות שאינן קוסקוס/שניצל אינן תלויות ביום מכירה, ולכן הן
 * תמיד פתוחות — זה בדיוק מה ש-`evaluateCustomerSaleDay` מחזיר.
 */
ordersRouter.get('/sale-day', optionalAuth, async (req, res, next) => {
  try {
    const category = String(req.query.category ?? '');
    if (!isCategory(category)) throw badRequest('invalid_order', 'category');

    const date = await resolveCustomerSaleDate(prisma, undefined, category);
    const rec = await loadSaleDayView(prisma, date, category);
    /**
     * ⚠ **האם כבר ביקשה תזכורת · 17 בספטמבר 2026** · בקשה של שקד:
     * ״במידה ותזכורת הופעלה כבר, לא להציע לבן אדם להפעיל שוב״.
     * חוזר כאן ולא בנקודה נפרדת · הלקוח כבר שואל את המצב ממילא.
     */
    const reminder = req.user
      ? (await prisma.saleReminder.findUnique({
          where: { userId_category: { userId: req.user.id, category } },
          select: { id: true },
        })) !== null
      : false;
    /* ⚠ אותו חלון לשני החישובים · ראו `saleWindow` */
    const windowDate = saleWindow(new Date()).date;
    const problem = evaluateCustomerSaleDay({
      rec,
      category,
      requested: {},
      today: isoDate(new Date()),
      windowDate,
    });
    res.json({
      category,
      date,
      open: problem === null,
      /* ⚠ שלושת המצבים · ראו `saleDayState` */
      state: saleDayState({ rec, category, today: isoDate(new Date()), windowDate }),
      /* ⚠ מזהים בלבד · ראו `soldOutDishes` · הלקוחה לא רואה מספרים */
      soldOut: soldOutDishes(rec, category),
      reminder,
      reason: problem?.code ?? '',
      message: problem?.message ?? '',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ההתראות הפתוחות של הלקוחה.
 *
 * לכל תזכורת שביקשה — אם יום המכירה של אותה קטגוריה **נפתח**
 * ועדיין לא הוצגה עליו התראה, היא חוזרת כאן. שקד החלטה
 * ב-15 בספטמבר 2026: התזכורת מגיעה כהתראה **בתוך האפליקציה**.
 */
ordersRouter.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const mine = await prisma.saleReminder.findMany({ where: { userId: req.user!.id } });
    const today = isoDate(new Date());
    const out: { category: string; date: string }[] = [];

    for (const rem of mine) {
      if (!isCategory(rem.category)) continue;
      const date = await resolveCustomerSaleDate(prisma, undefined, rem.category);
      /* כבר הוצגה התראה על היום הזה · לא חוזרים עליה */
      if (rem.seenDate === date) continue;
      const rec = await loadSaleDayView(prisma, date, rem.category);
      const problem = evaluateCustomerSaleDay({ rec, category: rem.category, requested: {}, today });
      if (problem === null) out.push({ category: rem.category, date });
    }
    res.json({ notifications: out });
  } catch (err) {
    next(err);
  }
});

/**
 * רישום אסימון הדחיפה של המכשיר.
 *
 * ⚠ **נוסף ב-18 בספטמבר 2026** · ראו `push/saleOpen.ts`. נשלח
 * מהאפליקציה אחרי כניסה, ומעודכן בכל כניסה — אסימון של Expo יכול
 * להתחלף, ומכשיר שהוחלף בעלים צריך לעבור לחשבון החדש.
 *
 * ⚠ **`upsert` על האסימון ולא על המשתמשת** · לאותה לקוחה יכולים
 * להיות כמה מכשירים, ולאותו מכשיר יכולה להתחלף הבעלים.
 */
ordersRouter.post('/push-token', requireAuth, async (req, res, next) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const platform = String(req.body?.platform ?? '').slice(0, 20);
    if (!isExpoToken(token)) throw badRequest('invalid_order', 'token');
    await prisma.pushToken.upsert({
      where: { token },
      create: { token, platform, userId: req.user!.id },
      update: { platform, userId: req.user!.id },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** סימון התראה כנקראה · לא מוחקים את התזכורת, כדי שתעבוד גם בשבוע הבא */
ordersRouter.post('/notifications/seen', requireAuth, async (req, res, next) => {
  try {
    const category = String(req.body?.category ?? '');
    const date = String(req.body?.date ?? '');
    if (!isCategory(category)) throw badRequest('invalid_order', 'category');
    await prisma.saleReminder.updateMany({
      where: { userId: req.user!.id, category },
      data: { seenDate: date },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * בקשת תזכורת לפתיחת יום מכירה.
 * ⚠ **נשמרת בלבד** · איך התזכורת מגיעה ללקוחה עדיין לא הוחלט.
 */
ordersRouter.post('/remind', requireAuth, async (req, res, next) => {
  try {
    const category = String(req.body?.category ?? '');
    if (!isCategory(category)) throw badRequest('invalid_order', 'category');
    await prisma.saleReminder.upsert({
      where: { userId_category: { userId: req.user!.id, category } },
      update: {},
      create: { userId: req.user!.id, category },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * ביטול תזכורת.
 * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״אם ילחצו עליו שוב פשוט
 * יקפוץ… ״התזכורת נמחקה״ והאייקון יתחלף בחזרה לפעמון בלי קו״.
 * ⚠ מחיקה של מה שאינו קיים אינה שגיאה · התוצאה זהה.
 */
ordersRouter.delete('/remind', requireAuth, async (req, res, next) => {
  try {
    const category = String(req.query.category ?? req.body?.category ?? '');
    if (!isCategory(category)) throw badRequest('invalid_order', 'category');
    await prisma.saleReminder.deleteMany({ where: { userId: req.user!.id, category } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/', optionalAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const category = body.details.category;
    if (category !== 'chef' && !req.user) throw forbidden('login_required');

    const row = await placeCustomerOrder({
      userId: req.user?.id ?? null,
      userName: req.user?.name ?? '',
      userPhone: req.user?.phone ?? '',
      ship: body.ship,
      time: body.time,
      city: body.city,
      address: body.address,
      pay: body.pay,
      saleDate: body.saleDate,
      name: body.name,
      phone: body.phone,
      details: body.details as CustomerDetails,
    });

    notifyLater(notifyOrderConfirmed(row));
    res.status(201).json({ order: serializeOrder(row) });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    /* ⚠ תקרה · לקוחה ותיקה תצבור מאות הזמנות · ראו `http/page` */
    const { take, skip } = readPage(req.query as Record<string, unknown>);
    const where = { userId: req.user!.id };
    const rows = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    res.json({ orders: rows.map(serializeOrder), total: await prisma.order.count({ where }) });
  } catch (err) {
    next(err);
  }
});

/** שכפול שורות הזמנה קודמת · מחיר מהקטלוג, יום מכירה הבא הפתוח */
ordersRouter.post('/:id/reorder', requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const original = await prisma.order.findUnique({ where: { id } });
    if (!original) throw notFound();
    if (original.userId !== req.user!.id && req.user!.role !== 'admin') throw forbidden();

    const details = parseCustomerDetails(readJson(original.detailsJson, null));
    if (!details) throw badRequest('reorder_unavailable', 'אי אפשר להזמין שוב את ההזמנה הזו');

    const body = reorderSchema.parse(req.body ?? {});
    const ship = body.ship ?? (original.ship === 'deliv' ? 'deliv' : 'self');
    const row = await placeCustomerOrder({
      userId: req.user!.id,
      userName: req.user!.name,
      userPhone: req.user!.phone ?? '',
      ship,
      time: body.time ?? original.time,
      city: body.city ?? original.city,
      address: body.address ?? original.address,
      pay: body.pay ?? original.pay,
      saleDate: body.saleDate,
      name: body.name ?? original.name,
      phone: body.phone ?? original.phone,
      details,
    });

    notifyLater(notifyOrderConfirmed(row));
    res.status(201).json({ order: serializeOrder(row), from: original.id });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const row = await prisma.order.findUnique({ where: { id } });
    if (!row) throw notFound();
    if (row.userId !== req.user!.id && req.user!.role !== 'admin') throw forbidden();
    res.json({ order: serializeOrder(row) });
  } catch (err) {
    next(err);
  }
});

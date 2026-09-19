import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { badRequest, notFound } from '../errors.ts';
import { isPhone, normalizePhone, publicUser } from '../auth/identity.ts';
import { CANCELLED, DELIVERED, FLOW, canAdvance, parseStatus } from '../catalog/status.ts';
import { PAGE_MAX, readPage } from '../http/page.ts';
import { defaultSaleDate, isCategory, quoteAdminDraft } from '../catalog/quote.ts';
import { serializeAdminCard, serializeOrder } from '../orders/serialize.ts';
import { FLOW as BOARD_FLOW } from '../../../mobile/src/data/adminBoard.ts';
import { qtyOfOrder } from '../admin/sold.ts';
import { readJson } from '../json.ts';
import { CATS, MONTHS, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { notifyLater, notifyOrderConfirmed, notifyOrderStatus } from '../whatsapp/notify.ts';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/orders', async (req, res, next) => {
  try {
    const statusRaw = typeof req.query.status === 'string' ? req.query.status : '';
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const status = statusRaw ? parseStatus(statusRaw) : null;
    if (statusRaw && !status) throw badRequest('invalid_status');
    if (category && !isCategory(category)) throw badRequest('invalid_category');

    /**
     * ⚠ **סינון לפי יום מכירה ועימוד · 18 בספטמבר 2026** · בקשה של
     * שקד: ״בעמוד ההזמנות לראות רק את ההזמנות הפתוחות שקשורות לאותה
     * המכירה הנוכחית. את כל השאר שיהיו בהיסטוריית הזמנות״.
     *
     * ⚠ **שניהם אופציונליים** · בלעדיהם התשובה זהה למה שהייתה, ולכן
     * שום קורא קיים לא נשבר.
     *
     * ⚠ **עימוד בדילוג ולא בסמן** · כאן המיון הוא לפי `createdAt`
     * בתוך **יום מכירה אחד**, כלומר קבוצה שאינה משתנה תוך כדי
     * גלילה. סמן היה מורכב יותר בלי להרוויח דבר.
     */
    const date = typeof req.query.date === 'string' ? req.query.date : '';
    /**
     * ⚠ **`open=1` · ההזמנות שעדיין דורשות עבודה** · מסך ההזמנות
     * מציג את המכירה הנוכחית, ובנוסף הזמנות פתוחות ממכירות קודמות
     * כדי שעבודה שלא נסגרה לא תיעלם. בלי הדגל הזה הוא היה חייב
     * למשוך את **כל** ההזמנות מאז ומעולם רק כדי למצוא אותן.
     */
    const openOnly = req.query.open === '1' || req.query.open === 'true';
    /**
     * ⚠ **תקרה גם כשלא ביקשו · 19 בספטמבר 2026** · קודם היעדר
     * `limit` החזיר את **כל ההזמנות מאז ומעולם**. `total` בתשובה
     * אומר לקורא שיש עוד · ראו `http/page`.
     */
    const { take, skip } = readPage(req.query as Record<string, unknown>);

    const where = {
      /* ⚠ סטטוס מפורש גובר על `open` · שניהם כותבים לאותו שדה */
      ...(status ? { status } : openOnly ? { status: { notIn: [DELIVERED, CANCELLED] } } : {}),
      ...(category ? { category } : {}),
      ...(date ? { saleDate: date } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const rows = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    /* ⚠ נדרש כדי לדעת אם יש עוד · בלעדיו הגלילה לא יודעת מתי לעצור */
    const total = await prisma.order.count({ where });

    res.json({
      orders: rows.map(serializeOrder),
      cards: rows.map(serializeAdminCard),
      total,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * היסטוריית ההזמנות · **ימי מכירה, לא הזמנות**.
 *
 * ⚠ **נבנה ב-18 בספטמבר 2026** · בקשה של שקד: ״שיהיו בהיסטוריית
 * הזמנות, מחולקות לפי קטגוריות ומחולקות לכל תאריך. בראשי אני אראה
 * רק את התאריך, וכשאני אלחץ על התאריך ייפתחו כל ההזמנות של אותה
 * מכירה״.
 *
 * ⚠ **זו הנקודה שמחליפה את הצורך בעימוד במסך הראשי** · במקום לשלוח
 * אלפי הזמנות, נשלחת **שורה אחת ליום מכירה**. ההזמנות עצמן נטענות
 * רק כשפותחים תאריך, ושם כבר יש עימוד.
 */
adminRouter.get('/orders/history', async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    if (category && !isCategory(category)) throw badRequest('invalid_category');

    const rows = await prisma.order.groupBy({
      by: ['category', 'saleDate'],
      where: {
        ...(category ? { category } : {}),
        /* ⚠ יום בלי תאריך אינו יום מכירה · הצעות שף ובקשות מחיר */
        saleDate: { not: '' },
      },
      _count: { _all: true },
    });

    const days = rows
      .map((r: { category: string; saleDate: string; _count: { _all: number } }) => ({
        category: r.category,
        date: r.saleDate,
        orders: r._count._all,
      }))
      /* החדש למעלה · אותו סדר שבו היא חושבת על המכירות */
      .sort((a: { date: string }, b: { date: string }) => (a.date < b.date ? 1 : -1));

    res.json({ days });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/orders/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const row = await prisma.order.findUnique({ where: { id } });
    if (!row) throw notFound();
    res.json({ order: serializeOrder(row), card: serializeAdminCard(row) });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const body = z
      .object({
        status: z.string().min(1),
        reason: z.string().optional(),
        note: z.string().optional(),
        board: z.boolean().optional(),
      })
      .parse(req.body);

    const nextStatus = parseStatus(body.status);
    if (!nextStatus) throw badRequest('invalid_status');

    const id = String(req.params.id ?? '');
    const row = await prisma.order.findUnique({ where: { id } });
    if (!row) throw notFound();
    const boardOk =
      body.board &&
      (BOARD_FLOW as readonly string[]).includes(nextStatus) &&
      row.status !== CANCELLED;
    if (!boardOk && !canAdvance(row.status, nextStatus)) throw badRequest('invalid_transition');

    const updated = await prisma.order.update({
      where: { id: row.id },
      data: {
        status: nextStatus,
        cancelReason: nextStatus === CANCELLED ? (body.reason ?? '') : row.cancelReason,
        cancelNote: nextStatus === CANCELLED ? (body.note ?? '') : row.cancelNote,
      },
    });

    notifyLater(notifyOrderStatus(updated));
    res.json({ order: serializeOrder(updated), card: serializeAdminCard(updated) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/orders', async (req, res, next) => {
  try {
    const body = z
      .object({
        category: z.enum(['cous', 'schn', 'box', 'fruit', 'chef']),
        name: z.string().min(1),
        phone: z.string().min(1),
        ship: z.enum(['self', 'deliv', 'pickup']),
        area: z.string().optional(),
        address: z.string().optional(),
        time: z.string().min(1),
        pay: z.string().optional(),
        saleDate: z.string().optional(),
        qty: z.record(z.number().int().nonnegative()).default({}),
        rolls: z
          .array(z.object({ type: z.string(), tops: z.array(z.string()) }))
          .default([]),
      })
      .parse(req.body);

    if (!isPhone(body.phone)) throw badRequest('invalid_phone');

    const ship = body.ship === 'pickup' ? 'self' : body.ship;
    const quote = quoteAdminDraft({
      category: body.category,
      qty: body.qty,
      rolls: body.rolls,
      ship,
      area: body.area ?? 'יבנה',
      address: body.address ?? '',
      time: body.time,
      applyShipping: true,
    });

    const row = await prisma.order.create({
      data: {
        userId: null,
        category: body.category,
        status: FLOW[0],
        name: body.name.trim(),
        phone: normalizePhone(body.phone),
        ship,
        time: body.time.trim(),
        city: ship === 'deliv' ? (body.area ?? '') : '',
        address: ship === 'deliv' ? (body.address ?? '').trim() : '',
        pay: body.pay?.trim() || 'טרם שולם',
        saleDate: defaultSaleDate(body.saleDate),
        via: '',
        itemsJson: JSON.stringify(quote.lines),
        detailsJson: JSON.stringify({ source: 'admin', qty: body.qty, rolls: body.rolls }),
        itemsTotal: quote.itemsTotal,
        shippingFee: quote.shippingFee,
        total: quote.total,
      },
    });

    notifyLater(notifyOrderConfirmed(row));
    res.status(201).json({ order: serializeOrder(row), card: serializeAdminCard(row) });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/orders/:id/qty', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const body = z.object({ qty: z.record(z.number().int().nonnegative()) }).parse(req.body);
    const row = await prisma.order.findUnique({ where: { id } });
    if (!row) throw notFound();
    if (row.status === CANCELLED || row.status === DELIVERED) throw badRequest('locked');
    if (row.category !== 'cous') throw badRequest('qty_only_couscous');

    const quote = quoteAdminDraft({
      category: 'cous',
      qty: body.qty,
      rolls: [],
      ship: row.ship === 'deliv' ? 'deliv' : 'self',
      area: row.city || 'יבנה',
      address: row.address,
      time: row.time,
      applyShipping: row.shippingFee > 0,
    });
    const details = { source: 'admin', qty: body.qty, rolls: [] };
    const updated = await prisma.order.update({
      where: { id: row.id },
      data: {
        itemsJson: JSON.stringify(quote.lines),
        detailsJson: JSON.stringify(details),
        itemsTotal: quote.itemsTotal,
        shippingFee: quote.shippingFee,
        total: quote.total,
      },
    });
    res.json({ order: serializeOrder(updated), card: serializeAdminCard(updated), qty: body.qty });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/board', async (req, res, next) => {
  try {
    const date = typeof req.query.date === 'string' ? req.query.date : '';
    const category = typeof req.query.category === 'string' ? req.query.category : 'cous';
    const rows = await prisma.order.findMany({
      where: {
        category,
        ...(date ? { saleDate: date } : {}),
        status: { not: CANCELLED },
      },
      orderBy: { time: 'asc' },
      /* ⚠ בלי `date` זו כל ההיסטוריה של הקטגוריה · ראו `http/page` */
      take: PAGE_MAX,
    });
    const cancelled = await prisma.order.count({
      where: { category, ...(date ? { saleDate: date } : {}), status: CANCELLED },
    });

    /**
     * המכסות של היום · שקד ביקשה (15 בספטמבר 2026) שמוני המלאי
     * בראש הלוח יתעדכנו **מדף יום המכירה** ולא ממספרים קבועים.
     * אם אין רשומה ליום — נופלים למכסת ברירת המחדל של המנה.
     */
    const cat = CATS[category as DayCatKey];
    const day = date ? await prisma.saleDay.findUnique({ where: { date } }) : null;
    const saved = readJson<Record<string, number>>(day?.quotasJson ?? '', {});
    const quotas = Object.fromEntries(
      (cat?.dishes ?? []).map((d) => [d.id, saved[d.id] ?? d.q]),
    );

    res.json({
      orders: rows.map(serializeOrder),
      cards: rows.map(serializeAdminCard),
      qty: Object.fromEntries(rows.map((r) => [r.id, qtyOfOrder(r)])),
      quotas,
      cancelled,
    });
  } catch (err) {
    next(err);
  }
});

function sinceLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * ⚠ **היסטוריית ההזמנות לכל לקוחה · תקרה · 19 בספטמבר 2026** ·
 * המסך מציג רשימת הזמנות אחרונות, לא ארכיון. לקוחה ותיקה עם
 * מאות הזמנות הייתה מנפחת תשובה אחת למגה־בייטים.
 */
const CUSTOMER_HISTORY = 40;

adminRouter.get('/customers', async (req, res, next) => {
  try {
    /**
     * ⚠ **היה השאילתה הכבדה ביותר בשרת · תוקן ב-19 בספטמבר 2026** ·
     * כאן עמד `user.findMany` עם `include: { orders }` **בלי שום
     * גבול**: כל לקוחה, וכל הזמנה שהיא ביצעה אי־פעם, נטענו לזיכרון
     * בכל טעינת מסך. עם אלף לקוחות ועשרים הזמנות לכל אחת זה
     * עשרים אלף שורות בבקשה אחת.
     *
     * ⚠ **הסכומים לא נפגעו** · הפיתוי היה פשוט לחתוך את
     * ההזמנות — אבל אז ״סה״כ הוציאה״ היה יוצא **שגוי**, וזה גרוע
     * מאיטי. לכן הספירה והסכום מגיעים מ-`groupBy` על כל ההזמנות
     * של הלקוחות שבדף, וההיסטוריה המוצגת בלבד מוגבלת.
     */
    const { take, skip } = readPage(req.query as Record<string, unknown>);
    const where = { role: 'customer' };
    const rows = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: { orders: { orderBy: { createdAt: 'desc' }, take: CUSTOMER_HISTORY } },
    });
    const total = await prisma.user.count({ where });

    const ids = rows.map((u) => u.id);
    /* ⚠ סכום וספירה על **כל** ההזמנות, גם מה שמעבר לתקרת ההיסטוריה */
    const sums = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: ids }, status: { not: CANCELLED } },
      _sum: { total: true },
      _count: { _all: true },
    });
    const spentOf = new Map(sums.map((g) => [g.userId, g._sum.total ?? 0]));
    const countOf = new Map(sums.map((g) => [g.userId, g._count._all]));

    const customers = rows.map((u) => {
      const last = u.orders[0];
      const likes = [...new Set(u.orders.map((o) => o.category))];
      return {
        ...publicUser(u),
        orders: countOf.get(u.id) ?? 0,
        spent: spentOf.get(u.id) ?? 0,
        since: sinceLabel(u.createdAt),
        last: last
          ? `${last.saleDate || last.createdAt.toISOString().slice(0, 10)} · ${last.category}`
          : '',
        likes,
        history: u.orders.map((o) => ({
          id: o.id,
          d: o.createdAt.toISOString().slice(0, 10),
          k: o.category,
          t: serializeAdminCard(o).items,
          v: o.total,
          s: o.status,
        })),
      };
    });
    res.json({ customers, total });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/customers/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const body = z.object({ note: z.string() }).parse(req.body);
    const row = await prisma.user.update({ where: { id }, data: { note: body.note } });
    res.json({ customer: publicUser(row) });
  } catch (err) {
    next(err);
  }
});

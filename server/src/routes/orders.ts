import { Router } from 'express';
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
import { assertCustomerOrderDay } from '../orders/saleDay.ts';
import { serializeOrder } from '../orders/serialize.ts';
import { readJson } from '../json.ts';

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
        shippingFee: 0,
        total: quote.total,
      },
    });
  });
}

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

    res.status(201).json({ order: serializeOrder(row) });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders: rows.map(serializeOrder) });
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

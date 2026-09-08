import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { optionalAuth, requireAuth } from '../auth/middleware.ts';
import { badRequest, forbidden, notFound } from '../errors.ts';
import {
  assertFulfillment,
  defaultSaleDate,
  isCategory,
  quoteCustomer,
  type CustomerDetails,
} from '../catalog/quote.ts';
import { serializeOrder } from '../orders/serialize.ts';

export const ordersRouter = Router();

const detailsSchema = z.discriminatedUnion('category', [
  z.object({ category: z.literal('cous'), qty: z.array(z.number().int().nonnegative()) }),
  z.object({
    category: z.literal('schn'),
    mode: z.enum(['unit', 'box']),
    rolls: z.array(z.object({ type: z.number().int().nonnegative(), tops: z.array(z.string()) })),
    box: z.object({ type: z.number().int().nonnegative(), tops: z.array(z.string()) }).nullable(),
    cocottes: z.array(z.number().int().nonnegative()),
  }),
  z.object({ category: z.literal('fruit'), qty: z.array(z.number().int().nonnegative()) }),
  z.object({
    category: z.literal('box'),
    key: z.string().min(1),
    picks: z.record(z.string(), z.unknown()),
  }),
  z.object({
    category: z.literal('chef'),
    key: z.string().min(1),
    picks: z.record(z.string(), z.unknown()),
  }),
]);

const createSchema = z.object({
  ship: z.enum(['self', 'deliv']),
  time: z.string().min(4),
  city: z.string().optional(),
  address: z.string().optional(),
  pay: z.string().min(1),
  saleDate: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  details: detailsSchema,
});

ordersRouter.post('/', optionalAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const category = body.details.category;
    if (!isCategory(category)) throw badRequest('invalid_order', 'category');

    if (category !== 'chef' && !req.user) throw forbidden('login_required');

    const quote = quoteCustomer(body.details as CustomerDetails);
    assertFulfillment(category, quote.meals, {
      ship: body.ship,
      time: body.time,
      city: body.city,
      address: body.address,
      pay: body.pay,
    });

    const name = (body.name ?? req.user?.name ?? '').trim();
    const phone = (body.phone ?? req.user?.phone ?? '').trim();

    const row = await prisma.order.create({
      data: {
        userId: req.user?.id ?? null,
        category,
        status: 'חדשה',
        name,
        phone,
        ship: body.ship,
        time: body.time,
        city: body.ship === 'deliv' ? (body.city ?? '') : '',
        address: body.ship === 'deliv' ? (body.address ?? '').trim() : '',
        pay: body.pay,
        saleDate: defaultSaleDate(body.saleDate),
        via: '',
        itemsJson: JSON.stringify(quote.lines),
        detailsJson: JSON.stringify(body.details),
        itemsTotal: quote.itemsTotal,
        shippingFee: 0,
        total: quote.total,
      },
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

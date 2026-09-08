import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { badRequest, notFound } from '../errors.ts';
import { isPhone, normalizePhone, publicUser } from '../auth/identity.ts';
import { CANCELLED, FLOW, canAdvance, parseStatus } from '../catalog/status.ts';
import { defaultSaleDate, isCategory, quoteAdminDraft } from '../catalog/quote.ts';
import { serializeAdminCard, serializeOrder } from '../orders/serialize.ts';

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

    const rows = await prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      orders: rows.map(serializeOrder),
      cards: rows.map(serializeAdminCard),
    });
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
      })
      .parse(req.body);

    const nextStatus = parseStatus(body.status);
    if (!nextStatus) throw badRequest('invalid_status');

    const id = String(req.params.id ?? '');
    const row = await prisma.order.findUnique({ where: { id } });
    if (!row) throw notFound();
    if (!canAdvance(row.status, nextStatus)) throw badRequest('invalid_transition');

    const updated = await prisma.order.update({
      where: { id: row.id },
      data: {
        status: nextStatus,
        cancelReason: nextStatus === CANCELLED ? (body.reason ?? '') : row.cancelReason,
        cancelNote: nextStatus === CANCELLED ? (body.note ?? '') : row.cancelNote,
      },
    });

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

    res.status(201).json({ order: serializeOrder(row), card: serializeAdminCard(row) });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/customers', async (_req, res, next) => {
  try {
    const rows = await prisma.user.findMany({
      where: { role: 'customer' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ customers: rows.map(publicUser) });
  } catch (err) {
    next(err);
  }
});

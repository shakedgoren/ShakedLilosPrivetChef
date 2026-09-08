import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { badRequest, notFound } from '../errors.ts';
import { isPhone, normalizePhone, publicUser } from '../auth/identity.ts';
import { CANCELLED, DELIVERED, FLOW, canAdvance, parseStatus } from '../catalog/status.ts';
import { defaultSaleDate, isCategory, quoteAdminDraft } from '../catalog/quote.ts';
import { serializeAdminCard, serializeOrder } from '../orders/serialize.ts';
import { BOARD_FLOW } from '../../../mobile/src/data/adminBoard.ts';
import { qtyOfOrder } from '../admin/sold.ts';
import { MONTHS } from '../../../mobile/src/data/adminDays.ts';

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
    });
    const cancelled = await prisma.order.count({
      where: { category, ...(date ? { saleDate: date } : {}), status: CANCELLED },
    });
    res.json({
      orders: rows.map(serializeOrder),
      cards: rows.map(serializeAdminCard),
      qty: Object.fromEntries(rows.map((r) => [r.id, qtyOfOrder(r)])),
      cancelled,
    });
  } catch (err) {
    next(err);
  }
});

function sinceLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

adminRouter.get('/customers', async (_req, res, next) => {
  try {
    const rows = await prisma.user.findMany({
      where: { role: 'customer' },
      orderBy: { createdAt: 'desc' },
      include: { orders: { orderBy: { createdAt: 'desc' } } },
    });
    const customers = rows.map((u) => {
      const live = u.orders.filter((o) => o.status !== CANCELLED);
      const spent = live.reduce((s, o) => s + o.total, 0);
      const last = u.orders[0];
      const likes = [...new Set(u.orders.map((o) => o.category))];
      return {
        ...publicUser(u),
        orders: u.orders.length,
        spent,
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
    res.json({ customers });
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

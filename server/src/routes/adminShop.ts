import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { readJson } from '../json.ts';
import { notFound } from '../errors.ts';
import { monthKey } from '../admin/sold.ts';

export const adminShopRouter = Router();
adminShopRouter.use(requireAuth, requireAdmin);

export type ShopItemRow = {
  id: string;
  g: string;
  name: string;
  unit: string;
  qty: string;
  price: string;
  done: boolean;
  actual: string;
};

function serList(row: {
  id: string;
  area: string;
  openedAt: Date;
  closedAt: Date | null;
  itemsJson: string;
}) {
  return {
    id: row.id,
    area: row.area,
    openedAt: row.openedAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    items: readJson<ShopItemRow[]>(row.itemsJson, []),
  };
}

function paidOf(items: ShopItemRow[]): number {
  return items.reduce((s, x) => {
    if (!x.done) return s;
    const actual = parseFloat(String(x.actual).replace(/[^\d.]/g, ''));
    const qty = parseFloat(String(x.qty).replace(/[^\d.]/g, '')) || 0;
    const price = parseFloat(String(x.price).replace(/[^\d.]/g, '')) || 0;
    return s + (Number.isFinite(actual) && String(x.actual).trim() !== '' ? actual : qty * price);
  }, 0);
}

adminShopRouter.get('/active', async (_req, res, next) => {
  try {
    let row = await prisma.shoppingList.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: 'desc' },
    });
    if (!row) {
      row = await prisma.shoppingList.create({ data: { area: 'cous', itemsJson: '[]' } });
    }
    res.json({ list: serList(row) });
  } catch (err) {
    next(err);
  }
});

adminShopRouter.get('/history', async (req, res, next) => {
  try {
    const area = typeof req.query.area === 'string' ? req.query.area : '';
    const rows = await prisma.shoppingList.findMany({
      where: { closedAt: { not: null }, ...(area && area !== 'all' ? { area } : {}) },
      orderBy: { closedAt: 'desc' },
    });
    res.json({ lists: rows.map(serList) });
  } catch (err) {
    next(err);
  }
});

const itemSchema = z.object({
  id: z.string(),
  g: z.string(),
  name: z.string(),
  unit: z.string(),
  qty: z.string(),
  price: z.string(),
  done: z.boolean(),
  actual: z.string().optional().default(''),
});

adminShopRouter.put('/active', async (req, res, next) => {
  try {
    const body = z
      .object({
        area: z.string().optional(),
        items: z.array(itemSchema).optional(),
      })
      .parse(req.body);
    let row = await prisma.shoppingList.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: 'desc' },
    });
    if (!row) row = await prisma.shoppingList.create({ data: { area: body.area ?? 'cous', itemsJson: '[]' } });
    row = await prisma.shoppingList.update({
      where: { id: row.id },
      data: {
        ...(body.area !== undefined ? { area: body.area } : {}),
        ...(body.items !== undefined ? { itemsJson: JSON.stringify(body.items) } : {}),
      },
    });
    res.json({ list: serList(row) });
  } catch (err) {
    next(err);
  }
});

adminShopRouter.post('/active/close', async (_req, res, next) => {
  try {
    const row = await prisma.shoppingList.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: 'desc' },
    });
    if (!row) throw notFound();
    const items = readJson<ShopItemRow[]>(row.itemsJson, []);
    const done = items.filter((x) => x.done);
    if (!done.length) {
      res.status(400).json({ error: 'need_checked_item' });
      return;
    }
    const amount = Math.round(paidOf(done));
    const closed = await prisma.shoppingList.update({
      where: { id: row.id },
      data: { closedAt: new Date(), itemsJson: JSON.stringify(done) },
    });
    await prisma.expense.create({
      data: {
        category: 'חומרי גלם',
        amount,
        period: monthKey(new Date()),
        note: `קנייה · ${row.area}`,
        source: closed.id,
      },
    });
    const next = await prisma.shoppingList.create({ data: { area: row.area, itemsJson: '[]' } });
    res.json({ closed: serList(closed), list: serList(next), expense: amount });
  } catch (err) {
    next(err);
  }
});

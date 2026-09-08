import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { CATS, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { hebrewDayLabel, soldByDish } from '../admin/sold.ts';
import { readJson } from '../json.ts';
import { CANCELLED } from '../catalog/status.ts';
import { notFound } from '../errors.ts';

export const adminStockRouter = Router();
adminStockRouter.use(requireAuth, requireAdmin);

adminStockRouter.get('/sale', async (_req, res, next) => {
  try {
    const open = await prisma.saleDay.findMany({ where: { open: true }, orderBy: { date: 'asc' } });
    const days = [];
    for (const row of open) {
      const catKey = (row.blocked ? row.exceptCat : row.sale) as DayCatKey;
      const cat = CATS[catKey];
      if (!cat) continue;
      const orders = await prisma.order.findMany({
        where: { saleDate: row.date, category: catKey, status: { not: CANCELLED } },
      });
      const sold = soldByDish(orders, catKey, row.date);
      const waste = readJson<Record<string, number>>(row.wasteJson, {});
      const quotas = readJson<Record<string, number>>(row.quotasJson, {});
      days.push({
        cat: catKey,
        date: row.date,
        name: cat.n,
        day: hebrewDayLabel(row.date),
        hue: cat.hue,
        deep: cat.deep,
        rgb: cat.rgb,
        open: true,
        items: cat.dishes.map((d) => ({
          id: d.id,
          name: d.n,
          quota: quotas[d.id] ?? d.q,
          sold: sold[d.id] ?? 0,
          waste: waste[d.id] ?? 0,
        })),
      });
    }
    res.json({ days });
  } catch (err) {
    next(err);
  }
});

adminStockRouter.patch('/sale/:date/waste', async (req, res, next) => {
  try {
    const date = String(req.params.date ?? '');
    const body = z.object({ dishId: z.string(), waste: z.number().int().nonnegative() }).parse(req.body);
    const row = await prisma.saleDay.findUnique({ where: { date } });
    if (!row) throw notFound();
    const waste = readJson<Record<string, number>>(row.wasteJson, {});
    waste[body.dishId] = body.waste;
    await prisma.saleDay.update({ where: { date }, data: { wasteJson: JSON.stringify(waste) } });
    res.json({ ok: true, waste });
  } catch (err) {
    next(err);
  }
});

function serSupply(row: {
  id: string;
  groupName: string;
  name: string;
  unit: string;
  qty: number;
  min: number;
  per: number;
}) {
  return { id: row.id, g: row.groupName, name: row.name, unit: row.unit, n: row.qty, min: row.min, per: row.per || undefined };
}

adminStockRouter.get('/supply', async (_req, res, next) => {
  try {
    const rows = await prisma.supplyItem.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ items: rows.map(serSupply) });
  } catch (err) {
    next(err);
  }
});

adminStockRouter.post('/supply', async (req, res, next) => {
  try {
    const body = z
      .object({
        g: z.string().min(1),
        name: z.string().min(1),
        unit: z.string().min(1),
        n: z.number().int().nonnegative().default(0),
        min: z.number().int().nonnegative(),
        per: z.number().int().nonnegative().optional(),
      })
      .parse(req.body);
    const row = await prisma.supplyItem.create({
      data: {
        groupName: body.g,
        name: body.name,
        unit: body.unit,
        qty: body.n,
        min: body.min,
        per: body.per ?? 0,
      },
    });
    res.status(201).json({ item: serSupply(row) });
  } catch (err) {
    next(err);
  }
});

adminStockRouter.patch('/supply/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const body = z
      .object({
        n: z.number().int().nonnegative().optional(),
        min: z.number().int().nonnegative().optional(),
        name: z.string().optional(),
      })
      .parse(req.body);
    const row = await prisma.supplyItem.update({
      where: { id },
      data: {
        ...(body.n !== undefined ? { qty: body.n } : {}),
        ...(body.min !== undefined ? { min: body.min } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
      },
    });
    res.json({ item: serSupply(row) });
  } catch (err) {
    next(err);
  }
});

adminStockRouter.delete('/supply/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    await prisma.supplyItem.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

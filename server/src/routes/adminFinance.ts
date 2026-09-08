import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { EXPENSES, MONEY_CATS, PERIODS } from '../../../mobile/src/data/adminMoney.ts';
import { compareCost, menuRowsOf, unitCost, viewOf, type CostPart } from '../admin/costsMath.ts';
import { hebrewDayLabel, hebrewMonthYear, isoDate } from '../admin/sold.ts';
import { CANCELLED } from '../catalog/status.ts';
import { CATS, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { soldByDish } from '../admin/sold.ts';
import { readJson } from '../json.ts';
import { notFound } from '../errors.ts';
import { STATE } from '../../../mobile/src/data/adminHome.ts';

export const adminFinanceRouter = Router();
adminFinanceRouter.use(requireAuth, requireAdmin);

function periodRange(key: 'month' | 'quart' | 'year', now = new Date()): { from: Date; to: Date; label: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (key === 'month') {
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 1);
    return { from, to, label: hebrewMonthYear(now) };
  }
  if (key === 'quart') {
    const from = new Date(y, m - 2, 1);
    const to = new Date(y, m + 1, 1);
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return { from, to, label: `${months[from.getMonth()]}–${months[m]} ${y}` };
  }
  const from = new Date(y - 1, m + 1, 1);
  const to = new Date(y, m + 1, 1);
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return { from, to, label: `${months[from.getMonth()]} ${from.getFullYear()} – ${months[m]} ${y}` };
}

adminFinanceRouter.get('/money', async (req, res, next) => {
  try {
    const period = (typeof req.query.period === 'string' ? req.query.period : 'month') as 'month' | 'quart' | 'year';
    const key = period === 'quart' || period === 'year' ? period : 'month';
    const { from, to, label } = periodRange(key);
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lt: to },
        status: { not: CANCELLED },
        category: { not: 'fruit' },
      },
    });
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const byCat: Record<string, number> = { cous: 0, schn: 0, box: 0, chef: 0 };
    for (const o of orders) {
      if (o.category in byCat) byCat[o.category] += o.total;
    }

    const expenses = await prisma.expense.findMany({
      where: { createdAt: { gte: from, lt: to } },
    });
    const grouped: Record<string, number> = {};
    for (const e of EXPENSES) grouped[e.k] = 0;
    for (const e of expenses) grouped[e.category] = (grouped[e.category] ?? 0) + e.amount;
    const expTotal = Object.values(grouped).reduce((s, n) => s + n, 0);
    const profit = revenue - expTotal;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    const cats = MONEY_CATS.map((c) => {
      const v = byCat[c.id] ?? 0;
      const share = revenue > 0 ? v / revenue : c.share;
      return { ...c, v, pct: Math.round(share * 100), share };
    });

    res.json({
      period: key,
      label,
      periodName: PERIODS[key].n,
      revenue,
      expenses: expTotal,
      profit,
      margin,
      cats,
      expenseRows: EXPENSES.map((e) => ({ k: e.k, sub: e.sub, v: grouped[e.k] ?? 0 })),
    });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.get('/menu', async (_req, res, next) => {
  try {
    const rows = await prisma.productionDish.findMany();
    const views = rows.map(viewOf);
    res.json({ items: menuRowsOf(views) });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.get('/costs', async (_req, res, next) => {
  try {
    const rows = await prisma.productionDish.findMany();
    const views = rows.map(viewOf);
    res.json({
      dishes: views.map((d) => ({
        ...d,
        unit: unitCost(d, views),
        cost: compareCost(d, views),
      })),
    });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.put('/costs/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const body = z
      .object({
        price: z.number().optional(),
        yld: z.number().optional(),
        parts: z.array(z.object({ n: z.string(), price: z.number(), qty: z.number() })).optional(),
        note: z.string().optional(),
      })
      .parse(req.body);
    const existing = await prisma.productionDish.findUnique({ where: { id } });
    if (!existing) throw notFound();
    const row = await prisma.productionDish.update({
      where: { id },
      data: {
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.yld !== undefined ? { yieldQty: body.yld } : {}),
        ...(body.parts !== undefined ? { partsJson: JSON.stringify(body.parts) } : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
      },
    });
    const all = (await prisma.productionDish.findMany()).map(viewOf);
    const view = viewOf(row);
    res.json({ dish: { ...view, unit: unitCost(view, all), cost: compareCost(view, all) } });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.post('/costs/import/:listId', async (req, res, next) => {
  try {
    const listId = String(req.params.listId ?? '');
    const list = await prisma.shoppingList.findUnique({ where: { id: listId } });
    if (!list) throw notFound();
    const items = readJson<{ name: string; price: string; actual?: string; qty: string; done?: boolean }[]>(
      list.itemsJson,
      [],
    );
    const price: Record<string, number> = {};
    for (const it of items) {
      const p = parseFloat(String(it.price).replace(/[^\d.]/g, ''));
      if (it.name && Number.isFinite(p)) price[it.name.trim()] = p;
    }
    const dishes = await prisma.productionDish.findMany();
    let hit = 0;
    for (const d of dishes) {
      const parts = readJson<CostPart[]>(d.partsJson, []);
      let changed = false;
      const next = parts.map((p) => {
        const v = price[p.n.trim()];
        if (v === undefined) return p;
        hit++;
        changed = true;
        return { ...p, price: v };
      });
      if (changed) {
        await prisma.productionDish.update({ where: { id: d.id }, data: { partsJson: JSON.stringify(next) } });
      }
    }
    res.json({ hit, message: hit === 0 ? 'לא נמצאו מצרכים תואמים' : `עודכנו ${hit} שורות מצרכים` });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.get('/summary', async (_req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { not: CANCELLED } },
    });
    const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = await prisma.order.findMany({
      where: { createdAt: { gte: monthFrom, lt: end }, status: { not: CANCELLED }, category: { not: 'fruit' } },
    });
    const monthExp = await prisma.expense.aggregate({
      where: { createdAt: { gte: monthFrom, lt: end } },
      _sum: { amount: true },
    });
    const people = await prisma.user.count({ where: { role: 'customer' } });
    const openShop = await prisma.shoppingList.findFirst({ where: { closedAt: null } });
    const shopItems = openShop ? readJson<{ done: boolean }[]>(openShop.itemsJson, []) : [];
    const hist = await prisma.shoppingList.count({ where: { closedAt: { not: null } } });
    const supply = await prisma.supplyItem.findMany();
    const lowStock = supply.filter((s) => s.qty < s.min).length;
    const menuItems = await prisma.productionDish.count();
    const openDays = await prisma.saleDay.findMany({ where: { open: true } });
    const nextSale = await prisma.saleDay.findFirst({
      where: { sale: { not: '' }, date: { gte: isoDate(now) } },
      orderBy: { date: 'asc' },
    });

    const quotas = [];
    for (const day of openDays) {
      const catKey = (day.blocked ? day.exceptCat : day.sale) as DayCatKey;
      const cat = CATS[catKey];
      if (!cat) continue;
      const orders = await prisma.order.findMany({
        where: { saleDate: day.date, category: catKey, status: { not: CANCELLED } },
      });
      const sold = soldByDish(orders, catKey, day.date);
      const q = readJson<Record<string, number>>(day.quotasJson, {});
      const soldN = cat.dishes.reduce((s, d) => s + (sold[d.id] ?? 0), 0);
      const quotaN = cat.dishes.reduce((s, d) => s + (q[d.id] ?? d.q), 0);
      quotas.push({
        key: catKey,
        date: day.date,
        name: cat.short,
        hue: cat.hue,
        rgb: cat.rgb,
        sold: soldN,
        quota: quotaN,
        open: true,
      });
    }

    const newOrders = await prisma.order.count({ where: { status: 'חדשה' } });
    const revenue = monthOrders.reduce((s, o) => s + o.total, 0);
    const expenses = monthExp._sum.amount ?? 0;

    const byCat: Record<string, number> = { cous: 0, schn: 0, box: 0, fruit: 0, chef: 0 };
    const allMonth = await prisma.order.findMany({
      where: { createdAt: { gte: monthFrom, lt: end }, status: { not: CANCELLED } },
    });
    for (const o of allMonth) {
      if (o.category in byCat) byCat[o.category] += o.total;
    }
    const donutTotal = Object.values(byCat).reduce((s, n) => s + n, 0);

    res.json({
      subtitle: hebrewDayLabel(isoDate(now)),
      isOpen: openDays.some((d) => d.open),
      openDate: openDays[0]?.date ?? '',
      quotas,
      today: {
        orders: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + o.total, 0),
      },
      month: { revenue, expenses, profit: revenue - expenses },
      badges: {
        orders: newOrders,
        days: nextSale
          ? `${nextSale.date.slice(8).replace(/^0/, '')}.${nextSale.date.slice(5, 7).replace(/^0/, '')}`
          : STATE.nextSale,
        stock: lowStock,
        shop: shopItems.filter((x) => !x.done).length,
        people,
        menu: menuItems || STATE.menuItems,
        costs: now.getDate() === 1,
        hist,
      },
      donut: {
        total: donutTotal,
        shares: [
          { name: 'קוסקוס', color: '#7B5CBC', v: byCat.cous },
          { name: 'שישניצל', color: '#416D9E', v: byCat.schn },
          { name: 'ספיישל', color: '#437C59', v: byCat.box },
          { name: 'פירות', color: '#B04A76', v: byCat.fruit },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});


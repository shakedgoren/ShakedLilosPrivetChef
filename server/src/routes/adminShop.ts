import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { readJson } from '../json.ts';
import { splitByExpenseCat } from '../admin/expenseCats.ts';
import { notFound } from '../errors.ts';
import { monthKey } from '../admin/sold.ts';
import { readPage } from '../http/page.ts';
import { readCloseMethod } from '../admin/shopMethod.ts';
import { pantryFromShop, type ShopLine } from '../admin/pantryFromShop.ts';

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
    /* ⚠ תקרה · ההיסטוריה גדלה בכל קנייה שנסגרת · ראו `http/page` */
    const { take, skip } = readPage(req.query as Record<string, unknown>);
    const where = { closedAt: { not: null }, ...(area && area !== 'all' ? { area } : {}) };
    const rows = await prisma.shoppingList.findMany({
      where,
      orderBy: { closedAt: 'desc' },
      take,
      skip,
    });
    res.json({ lists: rows.map(serList), total: await prisma.shoppingList.count({ where }) });
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

/**
 * ⚠ **אמצעי התשלום של הקנייה · בקשת שקד, 11 באוקטובר 2026** ·
 * ״ברשימות קנייה אין אופציה לבחור שיטת תשלום״. סגירת רשימה יוצרת
 * רשומות הוצאה אמיתיות, ולכל הוצאה שמוקלדת ביד כבר יש `method`
 * מאז 23 בספטמבר — רק לאלה שנולדו מקנייה לא היה, ולכן הן נשארו
 * ״לא צוין״ לנצח ולא נספרו במעקב שלה. הסכמה עצמה ב-`shopMethod.ts`.
 */
adminShopRouter.post('/active/close', async (req, res, next) => {
  try {
    const method = readCloseMethod(req.body);
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
    /**
     * ⚠ **פיצול לקטגוריות** · שקד ביקשה (15 בספטמבר 2026) שהקנייה
     * לא תיפול תמיד על ״חומרי גלם״. הפיצול נעשה לפי קבוצת המצרך
     * (אריזות מול מזון) ולא לפי סוג הרשימה — ראו `expenseCats.ts`.
     */
    const period = monthKey(new Date());
    const split = splitByExpenseCat(done);
    for (const [category, sum] of Object.entries(split)) {
      if (sum <= 0) continue;
      await prisma.expense.create({
        data: {
          category,
          amount: sum,
          period,
          note: `קנייה · ${row.area}`,
          source: closed.id,
          /* ⚠ אותו אמצעי תשלום לכל הקטגוריות · הקנייה שולמה פעם אחת */
          method,
        },
      });
    }
    const next = await prisma.shoppingList.create({ data: { area: row.area, itemsJson: '[]' } });
    res.json({ closed: serList(closed), list: serList(next), expense: amount });
  } catch (err) {
    next(err);
  }
});

/**
 * המצרכים שנקנו · לבחירה ידנית לתוך מנה אחת.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״שאני אוכל ללחוץ על ייבוא
 * ואז לסמן דברים מהקניות ששימשו אותי להכנת המנה״. החישוב עצמו,
 * ובפרט המחיר ליחידה, יושב ב-`admin/pantryFromShop.ts` — שם הוא
 * נבדק.
 *
 * ⚠ **קריאה בלבד** · ההוספה למתכון נעשית ב-`PUT /admin/costs/:id`
 * הקיים, עם הרשימה המלאה של המצרכים. אין כאן נתיב כתיבה חדש,
 * ולכן גם אין דרך חדשה לשנות מתכון בטעות.
 *
 * ⚠ **יושב אצל הקניות ולא אצל העלויות** · שתי סיבות. הנתונים הם
 * של רשימות הקניות, וגם: `/admin/costs/pantry` נכנס לצורה של
 * `PUT /admin/costs/:id`, ובדיקת `apiMethods` צדקה כשצעקה על זה.
 */
adminShopRouter.get('/pantry', async (_req, res, next) => {
  try {
    /* ⚠ תקרה · ההיסטוריה גדלה בכל קנייה שנסגרת */
    const lists = await prisma.shoppingList.findMany({
      orderBy: { openedAt: 'desc' },
      take: 40,
    });
    res.json({
      items: pantryFromShop(
        lists.map((l) => ({
          closedAt: l.closedAt,
          items: readJson<ShopLine[]>(l.itemsJson, []),
        })),
      ),
    });
  } catch (err) {
    next(err);
  }
});

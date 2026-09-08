import { prisma } from '../src/db.ts';
import { env } from '../src/env.ts';
import { hashPassword } from '../src/auth/passwords.ts';
import { normalizePhone } from '../src/auth/identity.ts';
import { PEOPLE } from '../../mobile/src/data/adminCustomers.ts';
import { SEED as DAY_SEED } from '../../mobile/src/data/adminDays.ts';
import { SUPPLY } from '../../mobile/src/data/adminStock.ts';
import { SEED as SHOP_SEED } from '../../mobile/src/data/adminShopping.ts';
import { HIST_BUYS } from '../../mobile/src/data/adminHistory.ts';
import { COST_DISHES } from '../../mobile/src/data/adminCosts.ts';
import { EXPENSES } from '../../mobile/src/data/adminMoney.ts';
import { BOARD_SEED } from '../../mobile/src/data/adminBoard.ts';
import { BOOK } from '../../mobile/src/data/adminOrders.ts';
import { quoteAdminDraft } from '../src/catalog/quote.ts';

const PASS = 'changeme';

async function main() {
  const email = env.adminEmail.toLowerCase();
  const phone = normalizePhone(env.adminPhone);
  const passwordHash = await hashPassword(env.adminPassword);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      phone,
      passwordHash,
      name: env.adminName,
      role: 'admin',
    },
    update: {
      phone,
      passwordHash,
      name: env.adminName,
      role: 'admin',
    },
  });
  console.log(`seed · admin ${email}`);

  const customerHash = await hashPassword(PASS);
  const byPhone = new Map<string, string>();

  for (const p of PEOPLE) {
    const ph = normalizePhone(p.phone);
    const row = await prisma.user.upsert({
      where: { phone: ph },
      create: {
        phone: ph,
        email: `${ph}@customers.localhost`,
        passwordHash: customerHash,
        name: p.name,
        address: p.addr,
        city: p.addr.split(',').pop()?.trim() ?? '',
        note: p.note,
        role: 'customer',
        createdAt: new Date('2026-03-01'),
      },
      update: { name: p.name, address: p.addr, note: p.note },
    });
    byPhone.set(ph, row.id);
  }

  const extras = [
    { name: 'נועה פרץ', phone: '050-3344556', addr: 'הרצל 14, יבנה' },
    { name: 'ליאת דוד', phone: '050-9988776', addr: 'הבנים 2, נס ציונה' },
  ];
  for (const p of extras) {
    const ph = normalizePhone(p.phone);
    const row = await prisma.user.upsert({
      where: { phone: ph },
      create: {
        phone: ph,
        email: `${ph}@customers.localhost`,
        passwordHash: customerHash,
        name: p.name,
        address: p.addr,
        city: p.addr.split(',').pop()?.trim() ?? '',
        role: 'customer',
      },
      update: { name: p.name },
    });
    byPhone.set(ph, row.id);
  }

  for (const [date, rec] of Object.entries(DAY_SEED)) {
    await prisma.saleDay.upsert({
      where: { date },
      create: {
        date,
        blocked: !!rec.blocked,
        sale: rec.sale ?? '',
        exceptCat: rec.except ?? '',
        open: !!rec.open,
        quotasJson: JSON.stringify(rec.q ?? {}),
        wasteJson: '{}',
      },
      update: {
        blocked: !!rec.blocked,
        sale: rec.sale ?? '',
        exceptCat: rec.except ?? '',
        open: !!rec.open,
        quotasJson: JSON.stringify(rec.q ?? {}),
      },
    });
  }

  if ((await prisma.supplyItem.count()) === 0) {
    for (const s of SUPPLY) {
      await prisma.supplyItem.create({
        data: {
          groupName: s.g,
          name: s.name,
          unit: s.unit,
          qty: s.n,
          min: s.min,
          per: s.per ?? 0,
        },
      });
    }
  }

  if ((await prisma.shoppingList.count()) === 0) {
    await prisma.shoppingList.create({
      data: {
        area: 'cous',
        openedAt: new Date('2026-09-08T07:40:00'),
        itemsJson: JSON.stringify(
          SHOP_SEED.map((x, i) => ({
            id: String(i),
            g: x.g,
            name: x.name,
            unit: x.unit,
            qty: x.qty,
            price: x.price,
            done: x.done,
            actual: x.actual,
          })),
        ),
      },
    });
    const closedDates: Record<string, string> = {
      cous: '2026-09-01T07:40:00',
      schn: '2026-08-30T08:15:00',
      box: '2026-08-28T09:00:00',
      chef: '2026-08-26T11:20:00',
      gen: '2026-08-24T17:05:00',
      tabun: '2026-08-20T10:30:00',
    };
    for (const b of HIST_BUYS) {
      const closedAt = new Date(closedDates[b.area] ?? '2026-08-20T10:00:00');
      await prisma.shoppingList.create({
        data: {
          area: b.area,
          openedAt: closedAt,
          closedAt,
          itemsJson: JSON.stringify(
            b.rows.map((r, i) => ({
              id: String(i),
              g: 'כללי',
              name: r.n,
              unit: r.u,
              qty: String(r.q),
              price: String(r.p),
              done: true,
              actual: String(Math.round(r.p * r.q)),
            })),
          ),
        },
      });
    }
  }

  for (const d of COST_DISHES) {
    await prisma.productionDish.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        category: d.c,
        sub: d.sub,
        name: d.name,
        mode: d.mode,
        price: d.price,
        yieldQty: d.yld,
        note: d.note,
        fromJson: JSON.stringify(d.from),
        partsJson: JSON.stringify(d.parts),
      },
      update: {
        name: d.name,
        mode: d.mode,
        price: d.price,
        yieldQty: d.yld,
        note: d.note,
        fromJson: JSON.stringify(d.from),
        partsJson: JSON.stringify(d.parts),
      },
    });
  }

  if ((await prisma.expense.count()) === 0) {
    for (const e of EXPENSES) {
      await prisma.expense.create({
        data: {
          category: e.k,
          amount: e.gross,
          period: '2026-08',
          note: e.sub,
          createdAt: new Date('2026-08-15'),
        },
      });
      await prisma.expense.create({
        data: {
          category: e.k,
          amount: Math.round(e.gross * 0.35),
          period: '2026-09',
          note: e.sub,
          createdAt: new Date('2026-09-05'),
        },
      });
    }
  }

  if ((await prisma.order.count()) === 0) {
    const phoneOf = (name: string) => {
      const hit = [...PEOPLE, ...BOOK].find((p) => p.name === name);
      return hit ? normalizePhone(hit.phone) : '0500000001';
    };

    for (const o of BOARD_SEED) {
      const qty = { ...o.q };
      if (o.ship === 'deliv') {
        const meals = (qty.veg ?? 0) + (qty.chick ?? 0) + (qty.mafr ?? 0);
        if (meals < 4) qty.veg = (qty.veg ?? 0) + (4 - meals);
      }
      const quote = quoteAdminDraft({
        category: 'cous',
        qty,
        rolls: [],
        ship: o.ship === 'deliv' ? 'deliv' : 'self',
        area: o.note.includes('יבנה') ? 'יבנה' : 'אחר',
        address: o.ship === 'deliv' ? o.note : '',
        time: o.time,
        applyShipping: o.ship === 'deliv',
      });
      const ph = phoneOf(o.who);
      await prisma.order.create({
        data: {
          userId: byPhone.get(ph) ?? null,
          category: 'cous',
          status: o.status,
          name: o.who,
          phone: ph,
          ship: o.ship === 'deliv' ? 'deliv' : 'self',
          time: o.time,
          city: o.ship === 'deliv' ? (o.note.split(',').pop()?.trim() ?? '') : '',
          address: o.ship === 'deliv' ? o.note : '',
          pay: o.pay,
          saleDate: '2026-09-01',
          via: o.note === 'וואטסאפ' ? 'וואטסאפ' : '',
          itemsJson: JSON.stringify(quote.lines),
          detailsJson: JSON.stringify({ source: 'admin', qty }),
          itemsTotal: quote.itemsTotal,
          shippingFee: quote.shippingFee,
          total: quote.total,
          createdAt: new Date('2026-09-01T08:00:00'),
        },
      });
    }

    const extra: Array<{
      who: string;
      cat: 'schn' | 'box' | 'fruit' | 'chef' | 'cous';
      qty: Record<string, number>;
      status: string;
      time: string;
      pay: string;
      date: string;
      created: string;
    }> = [
      { who: 'יעל לוי', cat: 'schn', qty: { boxThin: 0 }, status: 'נמסרה', time: '11:40', pay: 'אפל פיי', date: '2026-08-21', created: '2026-08-21T09:00:00' },
      { who: 'רונית שגב', cat: 'fruit', qty: {}, status: 'נמסרה', time: '09:20', pay: 'מזומן', date: '2026-08-27', created: '2026-08-27T08:00:00' },
      { who: 'דנה כהן', cat: 'cous', qty: { veg: 2, chick: 1 }, status: 'נמסרה', time: '12:30', pay: 'ביט', date: '2026-08-25', created: '2026-08-25T09:00:00' },
      { who: 'שירה מזרחי', cat: 'chef', qty: {}, status: 'נמסרה', time: '18:00', pay: 'ביט', date: '2026-08-29', created: '2026-08-29T10:00:00' },
      { who: 'מיכל אברהם', cat: 'box', qty: {}, status: 'נמסרה', time: '10:00', pay: 'ביט', date: '2026-08-18', created: '2026-08-18T09:00:00' },
    ];

    for (const o of extra) {
      if (o.cat === 'cous' || (o.cat === 'schn' && Object.keys(o.qty).length)) {
        const quote = quoteAdminDraft({
          category: o.cat,
          qty: o.qty,
          rolls: o.cat === 'schn' ? [{ type: 'thin', tops: [] }, { type: 'thin', tops: [] }] : [],
          ship: 'self',
          area: 'יבנה',
          address: '',
          time: o.time,
          applyShipping: false,
        });
        const ph = phoneOf(o.who);
        await prisma.order.create({
          data: {
            userId: byPhone.get(ph) ?? null,
            category: o.cat,
            status: o.status,
            name: o.who,
            phone: ph,
            ship: 'self',
            time: o.time,
            pay: o.pay,
            saleDate: o.date,
            itemsJson: JSON.stringify(quote.lines),
            detailsJson: JSON.stringify({ source: 'seed', qty: o.qty }),
            itemsTotal: quote.itemsTotal,
            shippingFee: 0,
            total: quote.total,
            createdAt: new Date(o.created),
          },
        });
      } else {
        const amounts: Record<string, number> = { fruit: 300, box: 229, chef: 2000 };
        const names: Record<string, string> = {
          fruit: 'מגש פירות בינוני',
          box: '10 חלות לכל אירוע · סלטים',
          chef: 'ארוחת שף · 8 סועדים',
        };
        const total = amounts[o.cat] ?? 100;
        const ph = phoneOf(o.who);
        await prisma.order.create({
          data: {
            userId: byPhone.get(ph) ?? null,
            category: o.cat,
            status: o.status,
            name: o.who,
            phone: ph,
            ship: 'self',
            time: o.time,
            pay: o.pay,
            saleDate: o.date,
            itemsJson: JSON.stringify([{ name: names[o.cat], qty: 1, sum: total }]),
            detailsJson: JSON.stringify({ source: 'seed' }),
            itemsTotal: total,
            shippingFee: 0,
            total,
            createdAt: new Date(o.created),
          },
        });
      }
    }
  }

  console.log('seed · days / stock / shop / costs / customers / orders');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

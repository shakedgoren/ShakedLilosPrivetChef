import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATS, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { dishPrices } from './prices.ts';

/**
 * ⚠ **רגרסיה** · חלות השניצל (`thin`, `temp`) אינן ב-`MENU.schn`
 * אלא ב-`ROLL`, ולכן ״הכנסות עבור היום״ תמחרה אותן ב-0: שקד
 * עדכנה 30 שניצלים ו-20 פילה והסכום לא זז (15 בספטמבר 2026).
 */
test('לכל מנה של יום מכירה יש מחיר', () => {
  for (const cat of ['cous', 'schn'] as DayCatKey[]) {
    const price = dishPrices(cat);
    for (const d of CATS[cat].dishes) {
      assert.ok((price[d.id] ?? 0) > 0, `${cat}/${d.id} ללא מחיר`);
    }
  }
});

test('יום שניצל מלא · 30 דק, 20 טמפורה, 10 מארז, 8 מארז = 6,700 ₪', () => {
  const price = dishPrices('schn');
  const sold: Record<string, number> = { thin: 30, temp: 20, boxThin: 10, boxTemp: 8 };
  const total = CATS.schn.dishes.reduce((s, d) => s + (sold[d.id] ?? 0) * (price[d.id] ?? 0), 0);
  assert.equal(total, 6700);
});

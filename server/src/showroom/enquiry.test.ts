import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  BUSINESS_WA,
  EMPTY_ENQUIRY,
  enquiryLink,
  enquiryMessage,
  enquiryMissing,
  type Enquiry,
} from '../../../mobile/src/showroom/enquiry.ts';

/**
 * ⚠ **למה הבדיקה הזו קיימת** · `landing/data.js` אומר על נוסח
 * ההודעה: ״מבנה ההודעה נקבע על ידי שקד · אין לשנות את הסדר או
 * הכותרות״. הנוסח כתוב עכשיו **פעמיים** — שם ובאפליקציה — ואין
 * ביניהם ייבוא, כי האחד JS והשני TS. הבדיקה האחרונה כאן היא
 * השומר על הכפילות: היא קוראת את עמוד הנחיתה בפועל ונופלת אם
 * הנוסחים נפרדו.
 */

const FULL: Enquiry = {
  name: 'שקד גורן',
  phone: '052-505-6708',
  kind: 'הפרשת חלה',
  date: '2026-11-14',
  guests: '20',
  note: 'בלי חריף',
};

test('ההודעה מחזיקה את הסדר והכותרות של שקד', () => {
  assert.equal(
    enquiryMessage(FULL),
    [
      'היי שקד, אני מעוניין/ת לתכנן אירוע עם BITE & TELL.',
      '',
      'שם: שקד גורן',
      'טלפון: 052-505-6708',
      'סוג האירוע: הפרשת חלה',
      'תאריך: 2026-11-14',
      'מספר אורחים: 20',
      'פרטים נוספים: בלי חריף',
    ].join('\n'),
  );
});

test('שדה ריק יוצא כקו מפריד ולא כשורה חסרה', () => {
  const lines = enquiryMessage({ ...EMPTY_ENQUIRY, name: 'דנה', phone: '0501234567' }).split('\n');
  assert.equal(lines.length, 8, 'שמונה שורות תמיד · גם כשרק שם וטלפון מולאו');
  assert.equal(lines[4], 'סוג האירוע: —');
  assert.equal(lines[5], 'תאריך: —');
  assert.equal(lines[6], 'מספר אורחים: —');
  assert.equal(lines[7], 'פרטים נוספים: —');
});

test('רווחים בקצוות נחתכים · גם בשדות החובה', () => {
  const lines = enquiryMessage({ ...EMPTY_ENQUIRY, name: '  דנה  ', phone: ' 050 ' }).split('\n');
  assert.equal(lines[2], 'שם: דנה');
  assert.equal(lines[3], 'טלפון: 050');
});

test('רק שם וטלפון חוסמים את השליחה', () => {
  assert.equal(enquiryMissing(EMPTY_ENQUIRY), 'name');
  assert.equal(enquiryMissing({ ...EMPTY_ENQUIRY, name: 'דנה' }), 'phone');
  assert.equal(enquiryMissing({ ...EMPTY_ENQUIRY, name: 'דנה', phone: '050' }), null);
  // ⚠ רווחים אינם תשובה · ״ ״ בשם הוא שם חסר
  assert.equal(enquiryMissing({ ...EMPTY_ENQUIRY, name: '   ', phone: '050' }), 'name');
});

test('הקישור מצביע על המספר של העסק ומקודד את ההודעה', () => {
  const url = enquiryLink(FULL);
  assert.ok(url.startsWith(`https://wa.me/${BUSINESS_WA}?text=`));
  const text = decodeURIComponent(url.slice(url.indexOf('?text=') + 6));
  assert.equal(text, enquiryMessage(FULL));
  // ⚠ שורות חדשות חייבות לעבור קידוד · אחרת ההודעה נקטעת בשורה הראשונה
  assert.ok(!url.includes('\n'));
  assert.ok(url.includes('%0A'));
});

test('הנוסח לא נפרד מעמוד הנחיתה', () => {
  const landing = readFileSync(new URL('../../../landing/data.js', import.meta.url), 'utf8');

  // ⚠ המספר · אותו מספר בשני הקבצים
  assert.ok(
    landing.includes(BUSINESS_WA),
    `המספר ${BUSINESS_WA} לא נמצא ב-landing/data.js · אחד מהשניים עודכן לבד`,
  );

  /**
   * ⚠ **הכותרות נגזרות מהקוד ולא מודפסות כאן** · אם היו כתובות
   * ידנית, שינוי ב-`enquiryMessage` היה עובר את הבדיקה הזו בשקט
   * והיא הייתה שומרת רק על צד עמוד הנחיתה. כך שינוי **בכל אחד**
   * משני הצדדים מפיל אותה.
   */
  const SENTINEL = '\u0001';
  const prefixes = enquiryMessage({
    name: SENTINEL,
    phone: SENTINEL,
    kind: SENTINEL,
    date: SENTINEL,
    guests: SENTINEL,
    note: SENTINEL,
  })
    .split('\n')
    .filter((l) => l !== '')
    .map((l) => (l.includes(SENTINEL) ? l.slice(0, l.indexOf(SENTINEL)) : l));

  assert.equal(prefixes.length, 7, 'שורת פתיחה ושש כותרות');
  for (const p of prefixes) {
    assert.ok(
      landing.includes(`'${p}`),
      `״${p}״ לא נמצא ב-landing/data.js · הנוסחים נפרדו`,
    );
  }
});

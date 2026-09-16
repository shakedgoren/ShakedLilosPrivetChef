/**
 * אמצעי תשלום בהשקה · ביט, פייבוקס ומזומן בלבד.
 *
 * ⚠ **לא מהקנבס** · בקנבס (`shared.PAYMENTS`) מופיע גם אפל פיי.
 * שקד קבעה השקה בלי סליקת אשראי: ביט + פייבוקס + מזומן, ואישור
 * ידני במסך הניהול. הרשימה הזו היא מקור האמת ללקוחה ולשרת —
 * לא `mobile/src/data/shared.ts`, כדי שלא יידרס ב-emit.
 */

export const PAY_BIT = 'ביט';
export const PAY_PAYBOX = 'פייבוקס';
export const PAY_CASH = 'מזומן';

/** הזמנה ידנית בלי אמצעי שנבחר · מוצג במסך הניהול עד שסומן שולם */
export const PAY_UNSET = 'טרם שולם';

export const LAUNCH_PAYMENTS = [PAY_BIT, PAY_PAYBOX, PAY_CASH] as const;
export type LaunchPay = (typeof LAUNCH_PAYMENTS)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'waived'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const isLaunchPay = (v: string): v is LaunchPay =>
  (LAUNCH_PAYMENTS as readonly string[]).includes(v);

export const isPaymentStatus = (v: string): v is PaymentStatus =>
  (PAYMENT_STATUSES as readonly string[]).includes(v);

/**
 * אשראי / אפל פיי / כרטיס · לא מתקבלים בהשקה.
 * גם כתיב לועזי וגם השמות בעברית מהקנבס.
 */
const CREDIT_RE =
  /אפל\s*פיי|apple\s*pay|אשראי|כרטיס|credit|visa|mastercard|amex|\bcard\b/i;

export function isRejectedPay(v: string): boolean {
  const t = v.trim();
  if (!t) return false;
  if (isLaunchPay(t)) return false;
  if (t === PAY_UNSET) return false;
  return CREDIT_RE.test(t);
}

/** הזמנת לקוחה · רק שלושת אמצעי ההשקה */
export function isCustomerPay(v: string): v is LaunchPay {
  return isLaunchPay(v.trim());
}

/**
 * הזמנה ידנית במסך הניהול · מותר בלי אמצעי (טרם שולם),
 * אסור אשראי.
 */
export function isAdminPay(v: string): boolean {
  const t = v.trim();
  if (!t || t === PAY_UNSET) return true;
  return isLaunchPay(t);
}

export type PayChannel = {
  link: string;
  phone: string;
};

export type PayConfig = {
  methods: readonly LaunchPay[];
  bit: PayChannel;
  paybox: PayChannel;
};

export const EMPTY_PAY_CONFIG: PayConfig = {
  methods: LAUNCH_PAYMENTS,
  bit: { link: '', phone: '' },
  paybox: { link: '', phone: '' },
};

export function channelFor(pay: string, cfg: PayConfig): PayChannel | null {
  if (pay === PAY_BIT) return cfg.bit;
  if (pay === PAY_PAYBOX) return cfg.paybox;
  return null;
}

/** קישור לדפדפן, או חיוג אם זה מספר בלי http */
export function payHref(channel: PayChannel): string {
  const link = channel.link.trim();
  if (link) {
    if (/^https?:\/\//i.test(link) || /^bit:\/\//i.test(link)) return link;
    if (/^tel:/i.test(link)) return link;
    if (/^[\d+\-*\s]+$/.test(link)) return `tel:${link.replace(/[^\d+]/g, '')}`;
    return link;
  }
  const phone = channel.phone.trim();
  if (phone) return `tel:${phone.replace(/[^\d+]/g, '')}`;
  return '';
}

import { env } from '../env.ts';
import { badRequest } from '../errors.ts';
import {
  EMPTY_PAY_CONFIG,
  LAUNCH_PAYMENTS,
  PAY_UNSET,
  isCustomerPay,
  isPaymentStatus,
  isRejectedPay,
  type PayConfig,
  type PaymentStatus,
} from '../../../mobile/src/order/payments.ts';

export {
  LAUNCH_PAYMENTS,
  PAY_UNSET,
  isCustomerPay,
  isPaymentStatus,
  isRejectedPay,
  type PayConfig,
  type PaymentStatus,
};

/** הזמנת לקוחה · ביט / פייבוקס / מזומן בלבד */
export function assertCustomerPay(pay: string) {
  const t = pay.trim();
  if (isRejectedPay(t)) throw badRequest('invalid_order', 'pay');
  if (!isCustomerPay(t)) throw badRequest('invalid_order', 'pay');
}

/**
 * הזמנה ידנית · מותר ריק / ״טרם שולם״ / שלושת אמצעי ההשקה.
 * אשראי נדחה גם מכאן.
 */
export function assertAdminPay(pay: string) {
  const t = pay.trim();
  if (!t || t === PAY_UNSET) return;
  if (isRejectedPay(t) || !isCustomerPay(t)) throw badRequest('invalid_order', 'pay');
}

export function parsePaymentStatus(raw: string): PaymentStatus {
  const t = raw.trim().toLowerCase();
  const aliases: Record<string, PaymentStatus> = {
    pending: 'pending',
    unpaid: 'pending',
    paid: 'paid',
    waived: 'waived',
    ממתין: 'pending',
    שולם: 'paid',
    ויתור: 'waived',
  };
  const status = aliases[t];
  if (!status || !isPaymentStatus(status)) throw badRequest('invalid_payment_status');
  return status;
}

/** שדות העדכון לסימון שולם / טרם שולם / ויתור */
export function paymentPatch(status: PaymentStatus, now = new Date()) {
  if (status === 'pending') return { paymentStatus: 'pending' as const, paidAt: null };
  return { paymentStatus: status, paidAt: now };
}

export function publicPayConfig(): PayConfig {
  return {
    methods: LAUNCH_PAYMENTS,
    bit: {
      link: env.bitPayLink,
      phone: env.bitPayPhone,
    },
    paybox: {
      link: env.payboxPayLink,
      phone: env.payboxPayPhone,
    },
  };
}

export { EMPTY_PAY_CONFIG };

import { api } from './client';
import { apiEnabled } from './config';
import {
  EMPTY_PAY_CONFIG,
  LAUNCH_PAYMENTS,
  type PayConfig,
} from '../order/payments';

const fromEnv = (): PayConfig => ({
  methods: LAUNCH_PAYMENTS,
  bit: {
    link: (process.env.EXPO_PUBLIC_BIT_PAY_LINK ?? '').trim(),
    phone: (process.env.EXPO_PUBLIC_BIT_PAY_PHONE ?? '').trim(),
  },
  paybox: {
    link: (process.env.EXPO_PUBLIC_PAYBOX_PAY_LINK ?? '').trim(),
    phone: (process.env.EXPO_PUBLIC_PAYBOX_PAY_PHONE ?? '').trim(),
  },
});

/** קישורי ביט/פייבוקס · מהשרת כשיש API, אחרת מ-EXPO_PUBLIC_* */
export async function getPayConfig(): Promise<PayConfig> {
  if (!apiEnabled) return fromEnv();
  try {
    return await api<PayConfig>('/payments', { method: 'GET', auth: false });
  } catch {
    return fromEnv();
  }
}

export { EMPTY_PAY_CONFIG };

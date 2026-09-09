import { z } from 'zod';
import type { CustomerDetails } from '../catalog/quote.ts';

export const detailsSchema = z.discriminatedUnion('category', [
  z.object({ category: z.literal('cous'), qty: z.array(z.number().int().nonnegative()) }),
  z.object({
    category: z.literal('schn'),
    mode: z.enum(['unit', 'box']),
    rolls: z.array(z.object({ type: z.number().int().nonnegative(), tops: z.array(z.string()) })),
    box: z.object({ type: z.number().int().nonnegative(), tops: z.array(z.string()) }).nullable(),
    cocottes: z.array(z.number().int().nonnegative()),
  }),
  z.object({ category: z.literal('fruit'), qty: z.array(z.number().int().nonnegative()) }),
  z.object({
    category: z.literal('box'),
    key: z.string().min(1),
    picks: z.record(z.string(), z.unknown()),
  }),
  z.object({
    category: z.literal('chef'),
    key: z.string().min(1),
    picks: z.record(z.string(), z.unknown()),
  }),
]);

export function parseCustomerDetails(raw: unknown): CustomerDetails | null {
  const parsed = detailsSchema.safeParse(raw);
  return parsed.success ? (parsed.data as CustomerDetails) : null;
}

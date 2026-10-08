import { z } from 'zod';
import { PASS_RULE_TEXT, isStrongPassword } from '../../../mobile/src/auth/passwordRule.ts';
import { badRequest } from '../errors.ts';

/**
 * גוף `POST /auth/reset-password`.
 *
 * ⚠ **הסיסמה נבדקת כאן, לא ב-Zod השקט** · כלל החוזק היה על הסכמה,
 * וכישלון שלו חזר כלקוחה כ-`invalid_body` בלי משפט. המסך הציג
 * ״לא ניתן להתחבר כרגע״ — כלומר נראה שהאיפוס לא עשה כלום.
 * עכשיו הסיסמה החלשה היא `weak_password` עם אותו נוסח של ההרשמה.
 */
export const resetBody = z.object({
  who: z.string().min(3),
  code: z.string().min(4).max(10),
  /** החוזק נבדק אחרי הפיענוח, כדי שהשגיאה תהיה בעברית ולא `invalid_body` */
  password: z.string().min(1),
});

export type ResetBody = z.infer<typeof resetBody>;

export function readResetBody(input: unknown): ResetBody {
  const parsed = resetBody.safeParse(input);
  if (!parsed.success) throw parsed.error;
  if (!isStrongPassword(parsed.data.password)) {
    throw badRequest('weak_password', PASS_RULE_TEXT);
  }
  return parsed.data;
}

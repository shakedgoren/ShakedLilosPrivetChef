export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const badRequest = (code: string, message?: string) => new HttpError(400, code, message);
export const unauthorized = (code = 'unauthorized', message?: string) => new HttpError(401, code, message);
export const forbidden = (code = 'forbidden', message?: string) => new HttpError(403, code, message);
export const notFound = (code = 'not_found') => new HttpError(404, code);
export const conflict = (code: string, message?: string) => new HttpError(409, code, message);
/**
 * שירות חיצוני לא ענה · לא אשמת מי ששלח את הבקשה.
 * ⚠ נוסף ב-19 בספטמבר 2026 בשביל שליחת מייל האיפוס · ראו `auth.ts`.
 */
export const badGateway = (code: string, message?: string) => new HttpError(502, code, message);

/** כתובת ה-API · בלי המשתנה נשארת התחברות הדמה */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const apiEnabled = API_URL.length > 0;

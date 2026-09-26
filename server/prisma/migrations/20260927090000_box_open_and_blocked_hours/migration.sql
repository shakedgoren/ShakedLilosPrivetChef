-- מתג נפרד למארזי שישי, וחסימת שעות משלוח לתאריך · בקשות שקד, 27.9.2026
--
-- ⚠ **שתי העמודות עם ברירת מחדל** · ולכן השורות הקיימות מקבלות
-- אותה מיד, ואין רגע שבו שורה מפרה אילוץ.
--
-- ⚠ **`boxOpen` ברירת מחדל `false`** · זו הבקשה עצמה: המארזים
-- סגורים עד שהיא פותחת אותם. שינוי ברירת המחדל ל-`true` היה
-- פותח למפרע כל יום שכבר קיים בטבלה.

ALTER TABLE "SaleDay" ADD COLUMN "boxOpen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SaleDay" ADD COLUMN "blockedHoursJson" TEXT NOT NULL DEFAULT '[]';

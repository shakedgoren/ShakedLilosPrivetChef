-- מספר הזמנה רץ · בקשת שקד, 26 בספטמבר 2026
--
-- ⚠ **נכתבה ביד ולא על ידי `migrate dev`** · הגרסה האוטומטית מוסיפה
-- עמודה עם רצף ומשאירה את השורות הקיימות למזלן — Postgres ממלא
-- אותן לפי סדר פיזי בדיסק, שאינו סדר ההזמנות. כאן המילוי מפורש
-- לפי `createdAt`, ולכן ההזמנה הראשונה שהתקבלה מקבלת 1.
--
-- ⚠ **בטוחה על מסד עם נתונים** · העמודה נוספת ריקה, מתמלאת, ורק
-- אז ננעלת כחובה. אין רגע שבו שורה קיימת מפרה אילוץ.

-- 1 · העמודה · בשלב הזה מותר לה להיות ריקה
ALTER TABLE "Order" ADD COLUMN "number" INTEGER;

-- 2 · מילוי לפי סדר ההזמנה האמיתי
--     `id` כשובר שוויון · שתי הזמנות באותה מילישנייה חייבות סדר יציב
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS n
  FROM "Order"
)
UPDATE "Order" o
SET "number" = ordered.n
FROM ordered
WHERE o."id" = ordered."id";

-- 3 · הרצף להזמנות הבאות · מתחיל אחרי הגבוה ביותר שקיים
CREATE SEQUENCE "Order_number_seq" AS INTEGER OWNED BY "Order"."number";
SELECT setval('"Order_number_seq"', COALESCE((SELECT MAX("number") FROM "Order"), 0) + 1, false);
ALTER TABLE "Order" ALTER COLUMN "number" SET DEFAULT nextval('"Order_number_seq"');

-- 4 · מעכשיו חובה וייחודי
ALTER TABLE "Order" ALTER COLUMN "number" SET NOT NULL;
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

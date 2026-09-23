-- אמצעי תשלום בהוצאה · מזומן | אשראי | העברה · ריק = לא צוין
ALTER TABLE "Expense" ADD COLUMN "method" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FixedExpense" ADD COLUMN "method" TEXT NOT NULL DEFAULT '';

-- תדירות ההוצאה הקבועה · month | year
-- ברירת המחדל 'month' שומרת על ההתנהגות של כל התבניות הקיימות
ALTER TABLE "FixedExpense" ADD COLUMN "every" TEXT NOT NULL DEFAULT 'month';

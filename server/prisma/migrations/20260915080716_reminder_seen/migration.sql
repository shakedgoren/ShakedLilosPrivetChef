-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SaleReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenDate" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "SaleReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SaleReminder" ("category", "createdAt", "id", "userId") SELECT "category", "createdAt", "id", "userId" FROM "SaleReminder";
DROP TABLE "SaleReminder";
ALTER TABLE "new_SaleReminder" RENAME TO "SaleReminder";
CREATE UNIQUE INDEX "SaleReminder_userId_category_key" ON "SaleReminder"("userId", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

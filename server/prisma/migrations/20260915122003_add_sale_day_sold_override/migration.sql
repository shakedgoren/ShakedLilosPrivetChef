-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SaleDay" (
    "date" TEXT NOT NULL PRIMARY KEY,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "sale" TEXT NOT NULL DEFAULT '',
    "exceptCat" TEXT NOT NULL DEFAULT '',
    "open" BOOLEAN NOT NULL DEFAULT false,
    "quotasJson" TEXT NOT NULL DEFAULT '{}',
    "wasteJson" TEXT NOT NULL DEFAULT '{}',
    "soldJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SaleDay" ("blocked", "date", "exceptCat", "open", "quotasJson", "sale", "updatedAt", "wasteJson") SELECT "blocked", "date", "exceptCat", "open", "quotasJson", "sale", "updatedAt", "wasteJson" FROM "SaleDay";
DROP TABLE "SaleDay";
ALTER TABLE "new_SaleDay" RENAME TO "SaleDay";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

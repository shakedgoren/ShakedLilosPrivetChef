-- AlterTable
ALTER TABLE "User" ADD COLUMN "note" TEXT NOT NULL DEFAULT '';

-- AlterTable
CREATE INDEX "Order_saleDate_idx" ON "Order"("saleDate");

-- CreateTable
CREATE TABLE "SaleDay" (
    "date" TEXT NOT NULL PRIMARY KEY,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "sale" TEXT NOT NULL DEFAULT '',
    "exceptCat" TEXT NOT NULL DEFAULT '',
    "open" BOOLEAN NOT NULL DEFAULT false,
    "quotasJson" TEXT NOT NULL DEFAULT '{}',
    "wasteJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplyItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "min" INTEGER NOT NULL DEFAULT 0,
    "per" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "area" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "itemsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ShoppingList_closedAt_idx" ON "ShoppingList"("closedAt");

-- CreateIndex
CREATE INDEX "ShoppingList_area_idx" ON "ShoppingList"("area");

-- CreateTable
CREATE TABLE "ProductionDish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "sub" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "yieldQty" REAL NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "fromJson" TEXT NOT NULL DEFAULT '[]',
    "partsJson" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Expense_period_idx" ON "Expense"("period");

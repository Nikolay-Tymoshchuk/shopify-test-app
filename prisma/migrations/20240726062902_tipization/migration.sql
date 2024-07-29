/*
  Warnings:

  - You are about to alter the column `offerProductPrice` on the `Funnel` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Funnel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "triggerProductId" TEXT NOT NULL,
    "offerProductId" TEXT NOT NULL,
    "offerProductPrice" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Funnel" ("createdAt", "discount", "id", "offerProductId", "offerProductPrice", "shop", "title", "triggerProductId", "updatedAt") SELECT "createdAt", coalesce("discount", 0) AS "discount", "id", "offerProductId", "offerProductPrice", "shop", "title", "triggerProductId", "updatedAt" FROM "Funnel";
DROP TABLE "Funnel";
ALTER TABLE "new_Funnel" RENAME TO "Funnel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

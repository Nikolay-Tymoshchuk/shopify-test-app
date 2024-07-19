-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "Funnel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "triggerProductId" TEXT NOT NULL,
    "triggerProductTitle" TEXT NOT NULL,
    "triggerProductPrice" TEXT NOT NULL,
    "triggerProductImage" TEXT,
    "offerProductId" TEXT NOT NULL,
    "offerProductTitle" TEXT NOT NULL,
    "offerProductPrice" TEXT NOT NULL,
    "offerProductImage" TEXT,
    "totalDiscount" REAL DEFAULT 0,
    "totalRevenue" REAL DEFAULT 0,
    "totalOrders" INTEGER DEFAULT 0,
    "discount" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

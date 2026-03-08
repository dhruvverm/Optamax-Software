-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "state" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "dob" TEXT,
    "rightSph" REAL,
    "rightCyl" REAL,
    "rightAxis" REAL,
    "leftSph" REAL,
    "leftCyl" REAL,
    "leftAxis" REAL,
    "addPower" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Customer" ("addPower", "address", "city", "createdAt", "dob", "email", "id", "leftAxis", "leftCyl", "leftSph", "name", "phone", "pincode", "rightAxis", "rightCyl", "rightSph", "state") SELECT "addPower", "address", "city", "createdAt", "dob", "email", "id", "leftAxis", "leftCyl", "leftSph", "name", "phone", "pincode", "rightAxis", "rightCyl", "rightSph", "state" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

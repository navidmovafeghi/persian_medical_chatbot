-- CreateTable
CREATE TABLE "LaboratoryData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "testDate" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "unit" TEXT,
    "normalRange" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LaboratoryData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LaboratoryData_userId_idx" ON "LaboratoryData"("userId");

-- CreateIndex
CREATE INDEX "LaboratoryData_testDate_idx" ON "LaboratoryData"("testDate");

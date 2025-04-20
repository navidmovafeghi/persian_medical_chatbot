-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "speciality" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "dateTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminded" DATETIME,
    "remindBefore" INTEGER NOT NULL DEFAULT 24,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");

-- CreateIndex
CREATE INDEX "Appointment_dateTime_idx" ON "Appointment"("dateTime");

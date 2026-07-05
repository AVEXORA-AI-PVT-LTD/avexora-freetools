-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "toolSlug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Lead_event_createdAt_idx" ON "Lead"("event", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_toolSlug_idx" ON "Lead"("toolSlug");

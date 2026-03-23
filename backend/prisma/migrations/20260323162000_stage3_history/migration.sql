-- AlterTable
ALTER TABLE "Meeting"
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "endedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Meeting_hostId_idx" ON "Meeting"("hostId");
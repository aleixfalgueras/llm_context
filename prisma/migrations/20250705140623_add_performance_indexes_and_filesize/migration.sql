-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "fileSize" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "clients_userId_idx" ON "clients"("userId");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "user_usage_userId_idx" ON "user_usage"("userId");

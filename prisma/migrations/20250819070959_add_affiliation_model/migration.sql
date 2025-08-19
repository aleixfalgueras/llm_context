-- CreateTable
CREATE TABLE "affiliations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliationCode" TEXT NOT NULL,
    "parentAffiliationCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Gen Y',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliations_userId_key" ON "affiliations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliations_affiliationCode_key" ON "affiliations"("affiliationCode");

-- CreateIndex
CREATE INDEX "affiliations_userId_idx" ON "affiliations"("userId");

-- CreateIndex
CREATE INDEX "affiliations_parentAffiliationCode_idx" ON "affiliations"("parentAffiliationCode");

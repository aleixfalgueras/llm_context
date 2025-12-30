-- CreateEnum
CREATE TYPE "DynamicTextCategory" AS ENUM ('subscription_features');

-- CreateTable
CREATE TABLE "dynamic_texts" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" "DynamicTextCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dynamic_texts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dynamic_texts_key_idx" ON "dynamic_texts"("key");

-- CreateIndex
CREATE INDEX "dynamic_texts_category_idx" ON "dynamic_texts"("category");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_texts_key_languageCode_key" ON "dynamic_texts"("key", "languageCode");

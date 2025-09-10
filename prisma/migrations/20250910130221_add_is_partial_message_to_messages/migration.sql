/*
  Warnings:

  - You are about to alter the column `cost_usd` on the `messages` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `DoublePrecision`.
  - You are about to alter the column `spending_limit_usd` on the `user_subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `custom_spending_limit_usd` on the `user_subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `cost_usd` on the `user_usage` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `DoublePrecision`.
  - Made the column `cost_usd` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `spending_limit_usd` on table `user_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cost_usd` on table `user_usage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "documentsLanguage" SET DEFAULT 'en';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "isPartialMessage" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "cost_usd" SET NOT NULL,
ALTER COLUMN "cost_usd" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "generation_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_subscriptions" ALTER COLUMN "spending_limit_usd" SET NOT NULL,
ALTER COLUMN "spending_limit_usd" SET DEFAULT 5.8,
ALTER COLUMN "spending_limit_usd" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "custom_spending_limit_usd" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user_usage" ALTER COLUMN "cost_usd" SET NOT NULL,
ALTER COLUMN "cost_usd" SET DATA TYPE DOUBLE PRECISION;

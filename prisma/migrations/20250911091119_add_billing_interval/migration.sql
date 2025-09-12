-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('monthly', 'annual');

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "billingInterval" "BillingInterval" NOT NULL DEFAULT 'monthly';

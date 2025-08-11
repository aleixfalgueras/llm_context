/*
  Warnings:

  - The values [basic,pro,business] on the enum `SubscriptionPlan` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('apprentice', 'knight', 'master', 'jedi');
ALTER TABLE "user_subscriptions" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "user_subscriptions" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new" USING ("plan"::text::"SubscriptionPlan_new");
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";
DROP TYPE "SubscriptionPlan_old";
ALTER TABLE "user_subscriptions" ALTER COLUMN "plan" SET DEFAULT 'apprentice';
COMMIT;

-- AlterTable
ALTER TABLE "user_subscriptions" ALTER COLUMN "plan" SET DEFAULT 'apprentice';

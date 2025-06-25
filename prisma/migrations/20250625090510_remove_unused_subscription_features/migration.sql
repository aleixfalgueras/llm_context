/*
  Warnings:

  - You are about to drop the column `canAccessCustomBranding` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `canAccessPremiumPrompts` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `canAccessPrioritySupport` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `canAccessTeamFeatures` on the `user_subscriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "canAccessCustomBranding",
DROP COLUMN "canAccessPremiumPrompts",
DROP COLUMN "canAccessPrioritySupport",
DROP COLUMN "canAccessTeamFeatures";

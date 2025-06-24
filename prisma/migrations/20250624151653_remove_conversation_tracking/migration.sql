/*
  Warnings:

  - You are about to drop the column `maxConversationsPerMonth` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `conversationsUsed` on the `user_usage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "maxConversationsPerMonth";

-- AlterTable
ALTER TABLE "user_usage" DROP COLUMN "conversationsUsed";

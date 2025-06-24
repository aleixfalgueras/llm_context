/*
  Warnings:

  - You are about to drop the column `maxPromptsPerUser` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `promptsUsed` on the `user_usage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "maxPromptsPerUser";

-- AlterTable
ALTER TABLE "user_usage" DROP COLUMN "promptsUsed";

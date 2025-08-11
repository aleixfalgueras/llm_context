/*
  Warnings:

  - You are about to drop the column `completedAt` on the `account_deletion_requests` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `account_deletion_requests` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `account_deletion_requests` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `account_deletion_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "account_deletion_requests" DROP COLUMN "completedAt",
DROP COLUMN "expiresAt",
DROP COLUMN "status",
DROP COLUMN "updatedAt";

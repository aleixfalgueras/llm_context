/*
  Warnings:

  - You are about to drop the column `notes` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "notes",
ADD COLUMN     "generalContext" TEXT;

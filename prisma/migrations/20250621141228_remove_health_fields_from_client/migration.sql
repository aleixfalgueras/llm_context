/*
  Warnings:

  - You are about to drop the column `dateOfBirth` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `medicalHistory` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "dateOfBirth",
DROP COLUMN "height",
DROP COLUMN "medicalHistory",
DROP COLUMN "weight";

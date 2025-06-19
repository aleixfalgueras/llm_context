/*
  Warnings:

  - You are about to drop the column `message` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `feedbacks` table. All the data in the column will be lost.
  - Added the required column `description` to the `feedbacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `feedbacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `feedbacks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "message",
DROP COLUMN "rating",
DROP COLUMN "subject",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "useCase" TEXT;

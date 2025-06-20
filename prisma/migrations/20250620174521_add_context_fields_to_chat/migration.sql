-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "contextFields" TEXT[] DEFAULT ARRAY[]::TEXT[];

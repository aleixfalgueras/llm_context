-- CreateEnum
CREATE TYPE "PromptCategory" AS ENUM ('general', 'marketing', 'content', 'analysis');

-- AlterTable: Convert existing string column to enum
ALTER TABLE "prompts" 
  ALTER COLUMN "category" DROP DEFAULT,
  ALTER COLUMN "category" TYPE "PromptCategory" USING "category"::"PromptCategory",
  ALTER COLUMN "category" SET DEFAULT 'general'::"PromptCategory";
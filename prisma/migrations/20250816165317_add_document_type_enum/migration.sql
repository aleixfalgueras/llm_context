-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('meeting', 'custom_document', 'manual', 'chat');

-- Update existing data to handle custom-document -> custom_document conversion
UPDATE "documents" SET "documentType" = 'custom_document' WHERE "documentType" = 'custom-document';

-- Add temporary column with enum type
ALTER TABLE "documents" ADD COLUMN "documentType_new" "DocumentType";

-- Update the new column with converted values
UPDATE "documents" SET "documentType_new" = 
  CASE "documentType"
    WHEN 'meeting' THEN 'meeting'::"DocumentType"
    WHEN 'custom_document' THEN 'custom_document'::"DocumentType"
    WHEN 'manual' THEN 'manual'::"DocumentType"
    WHEN 'chat' THEN 'chat'::"DocumentType"
  END;

-- Make the new column NOT NULL
ALTER TABLE "documents" ALTER COLUMN "documentType_new" SET NOT NULL;

-- Drop the old column and rename the new one
ALTER TABLE "documents" DROP COLUMN "documentType";
ALTER TABLE "documents" RENAME COLUMN "documentType_new" TO "documentType";

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('feature', 'bug', 'complaint');

-- CreateEnum
CREATE TYPE "FeedbackPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "FeedbackState" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FALSE_ALARM');

-- Add temporary columns with enum types
ALTER TABLE "feedbacks" ADD COLUMN "type_new" "FeedbackType";
ALTER TABLE "feedbacks" ADD COLUMN "priority_new" "FeedbackPriority";
ALTER TABLE "feedbacks" ADD COLUMN "state_new" "FeedbackState";

-- Convert existing data to enum values
UPDATE "feedbacks" SET "type_new" = 
  CASE 
    WHEN "type" = 'feature' THEN 'feature'::"FeedbackType"
    WHEN "type" = 'bug' THEN 'bug'::"FeedbackType"
    WHEN "type" = 'complaint' THEN 'complaint'::"FeedbackType"
    ELSE 'complaint'::"FeedbackType" -- default fallback
  END;

UPDATE "feedbacks" SET "priority_new" = 
  CASE 
    WHEN "priority" = 'low' THEN 'low'::"FeedbackPriority"
    WHEN "priority" = 'medium' THEN 'medium'::"FeedbackPriority"
    WHEN "priority" = 'high' THEN 'high'::"FeedbackPriority"
    ELSE 'medium'::"FeedbackPriority" -- default fallback
  END;

UPDATE "feedbacks" SET "state_new" = 
  CASE 
    WHEN "state" = 'PENDING' THEN 'PENDING'::"FeedbackState"
    WHEN "state" = 'IN_PROGRESS' THEN 'IN_PROGRESS'::"FeedbackState"
    WHEN "state" = 'COMPLETED' THEN 'COMPLETED'::"FeedbackState"
    WHEN "state" = 'FALSE_ALARM' THEN 'FALSE_ALARM'::"FeedbackState"
    ELSE 'PENDING'::"FeedbackState" -- default fallback
  END;

-- Make the new columns NOT NULL
ALTER TABLE "feedbacks" ALTER COLUMN "type_new" SET NOT NULL;
ALTER TABLE "feedbacks" ALTER COLUMN "priority_new" SET NOT NULL;
ALTER TABLE "feedbacks" ALTER COLUMN "state_new" SET NOT NULL;

-- Drop old columns
ALTER TABLE "feedbacks" DROP COLUMN "type";
ALTER TABLE "feedbacks" DROP COLUMN "priority";
ALTER TABLE "feedbacks" DROP COLUMN "state";

-- Rename new columns to original names
ALTER TABLE "feedbacks" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "feedbacks" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "feedbacks" RENAME COLUMN "state_new" TO "state";

-- Set default value for state column
ALTER TABLE "feedbacks" ALTER COLUMN "state" SET DEFAULT 'PENDING';
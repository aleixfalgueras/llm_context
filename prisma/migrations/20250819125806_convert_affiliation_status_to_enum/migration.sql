-- CreateEnum
CREATE TYPE "AffiliationStatus" AS ENUM ('GenY', 'Indigo', 'LightWorker', 'CristalClub', 'D5Level', 'Walkin', 'SevenStars', 'InfinityStars', 'Alpha', 'Omega');

-- Add temporary column
ALTER TABLE "affiliations" ADD COLUMN "status_new" "AffiliationStatus" NOT NULL DEFAULT 'GenY';

-- Update data: convert string values to enum values
UPDATE "affiliations" SET "status_new" = 'GenY' WHERE "status" = 'Gen Y';
UPDATE "affiliations" SET "status_new" = 'Indigo' WHERE "status" = 'Indigo';
UPDATE "affiliations" SET "status_new" = 'LightWorker' WHERE "status" = 'Light Worker';
UPDATE "affiliations" SET "status_new" = 'CristalClub' WHERE "status" = 'Cristal Club';
UPDATE "affiliations" SET "status_new" = 'D5Level' WHERE "status" = '5 D Level';
UPDATE "affiliations" SET "status_new" = 'Walkin' WHERE "status" = 'Walkin';
UPDATE "affiliations" SET "status_new" = 'SevenStars' WHERE "status" = 'Seven Stars';
UPDATE "affiliations" SET "status_new" = 'InfinityStars' WHERE "status" = 'Infinity Stars';
UPDATE "affiliations" SET "status_new" = 'Alpha' WHERE "status" = 'Alpha';
UPDATE "affiliations" SET "status_new" = 'Omega' WHERE "status" = 'Omega';

-- Drop old column and rename new column
ALTER TABLE "affiliations" DROP COLUMN "status";
ALTER TABLE "affiliations" RENAME COLUMN "status_new" TO "status";

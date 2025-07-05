-- Fix field name typos in clients table
-- Rename columns from specifiContext to specificContext to preserve data

-- Rename specifiContext1 to specificContext1
ALTER TABLE "clients" RENAME COLUMN "specifiContext1" TO "specificContext1";

-- Rename specifiContext2 to specificContext2
ALTER TABLE "clients" RENAME COLUMN "specifiContext2" TO "specificContext2";

-- Rename specifiContext3 to specificContext3
ALTER TABLE "clients" RENAME COLUMN "specifiContext3" TO "specificContext3";